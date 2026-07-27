const db = require('../models');
const { z } = require('zod');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Customer.findAndCountAll({ limit, offset });
    
    // For each customer compute outstanding
    const customers = [];
    for (const c of rows) {
      const lastEntry = await db.CustomerAccountEntry.findOne({
        where: { customer_id: c.id },
        order: [['created_at', 'DESC']]
      });
      const outstanding = lastEntry ? parseFloat(lastEntry.balance_after) : 0;
      const utilisation = c.credit_limit > 0 ? (outstanding / c.credit_limit) * 100 : 0;
      customers.push({ ...c.toJSON(), outstanding, utilisation });
    }

    res.status(200).json({ success: true, data: customers, meta: { page, limit, total: count } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await db.Customer.findByPk(req.params.id, {
      include: [
        { model: db.CustomerAccountEntry, as: 'AccountEntries' } // ensure associations are correct
      ]
    });
    if (!customer) return res.status(404).json({ success: false, error: { message: 'Not found' }});
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { amount } = req.body;
    const customer_id = req.params.id;
    
    const customer = await db.Customer.findByPk(customer_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!customer) throw new Error('Customer not found');
    
    const lastEntry = await db.CustomerAccountEntry.findOne({
      where: { customer_id },
      order: [['created_at', 'DESC']],
      transaction: t
    });
    const currentBalance = lastEntry ? parseFloat(lastEntry.balance_after) : 0;
    const newBalance = currentBalance - parseFloat(amount); // payment reduces balance
    
    const entry = await db.CustomerAccountEntry.create({
      customer_id,
      entry_type: 'payment',
      reference: 'PAYMENT',
      amount,
      balance_after: newBalance
    }, { transaction: t });
    
    if (newBalance <= 0) customer.status = 'active';
    else if (newBalance > customer.credit_limit) customer.status = 'overdue'; // Simplified logic
    await customer.save({ transaction: t });
    
    await t.commit();
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
