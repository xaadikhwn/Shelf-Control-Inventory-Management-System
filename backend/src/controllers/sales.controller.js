const db = require('../models');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.SalesOrder.findAndCountAll({ 
      limit, 
      offset,
      include: [
        { model: db.Customer, attributes: ['id', 'company_name'] },
        { model: db.User, attributes: ['id', 'full_name'] }
      ]
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: { page, limit, total: count }
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const order = await db.SalesOrder.findByPk(req.params.id, {
      include: [
        { model: db.Customer },
        { model: db.SaleLine, include: [{ model: db.Product }] }
      ]
    });
    if (!order) {
      const err = new Error('Sales order not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { customer_id, payment_status, items } = req.body;
    
    // Calculate totals and check stock
    let total_amount = 0;
    const lineItemsToCreate = [];
    
    for (const item of items) {
      // Get product with row lock
      const product = await db.Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.quantity < item.quantity) throw new Error(`Insufficient stock for product ${product.name}`);
      
      const line_total = parseFloat(product.sale_price) * item.quantity;
      total_amount += line_total;
      
      lineItemsToCreate.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.sale_price,
        line_total
      });
      
      // Decrement stock
      product.quantity -= item.quantity;
      
      // Update status and alert
      let newStatus = 'in-stock';
      if (product.quantity <= 0) newStatus = 'out-of-stock';
      else if (product.quantity <= product.reorder_point) newStatus = 'low-stock';
      
      if (product.status !== newStatus) {
        product.status = newStatus;
      }
      
      if (newStatus !== 'in-stock') {
        const existingAlert = await db.StockAlert.findOne({
          where: { product_id: product.id, resolved_at: null },
          transaction: t
        });
        if (!existingAlert) {
          await db.StockAlert.create({
            product_id: product.id,
            quantity_at_trigger: product.quantity,
            threshold_at_trigger: product.reorder_point,
            triggered_at: new Date()
          }, { transaction: t });
        }
      }
      await product.save({ transaction: t });
    }
    
    const order_code = `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    
    const salesOrder = await db.SalesOrder.create({
      order_code,
      customer_id,
      order_date: new Date(),
      total_amount,
      order_status: 'completed', // simplified status handling
      payment_status,
      created_by: req.user.id
    }, { transaction: t });
    
    // Link line items
    for (const lineItem of lineItemsToCreate) {
      lineItem.sales_order_id = salesOrder.id;
      await db.SaleLine.create(lineItem, { transaction: t });
    }
    
    // If credit sale, update customer ledger
    if (payment_status === 'credit') {
      const customer = await db.Customer.findByPk(customer_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!customer) throw new Error('Customer not found');
      
      const balance_after = parseFloat(customer.credit_limit) - total_amount; // assuming credit limit acts as balance or vice versa?
      // Wait, "outstanding balance". Typically customers have a balance, and credit limit is the max.
      // Let's assume customer needs a balance field, but schema only has credit_limit.
      // But section 4.9 says `balance_after`. We can query last entry to get current balance.
      
      const lastEntry = await db.CustomerAccountEntry.findOne({
        where: { customer_id },
        order: [['created_at', 'DESC']],
        transaction: t
      });
      const currentBalance = lastEntry ? parseFloat(lastEntry.balance_after) : 0;
      const newBalance = currentBalance + total_amount;
      
      await db.CustomerAccountEntry.create({
        customer_id,
        entry_type: 'sale',
        reference: salesOrder.id.toString(),
        amount: total_amount,
        balance_after: newBalance
      }, { transaction: t });
      
      // Maybe update customer status?
      if (newBalance > parseFloat(customer.credit_limit)) {
        customer.status = 'warning';
        await customer.save({ transaction: t });
      }
    }
    
    await t.commit();
    res.status(201).json({ success: true, data: salesOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
