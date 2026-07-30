const db = require('../models');

exports.list = async (req, res, next) => {
  try {
    const suppliers = await db.Supplier.findAll();

    const formatted = suppliers.map((s) => ({
      id: s.vendor_code || `VND-${s.id}`,
      dbId: s.id,
      company: s.company_name,
      contact: s.contact_person || 'N/A',
      phone: s.phone || 'N/A',
      country: s.country || 'International',
      payable: 5000 + (s.id * 1250), // sample payable balance calculation
      creditTerms: s.credit_terms || 'Net 30',
      lastInvoice: s.last_invoice_at ? new Date(s.last_invoice_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      status: s.status || 'active'
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      vendor_code,
      vendorCode,
      id,
      company_name,
      companyName,
      company,
      contact_person,
      contactPerson,
      contact,
      phone,
      country,
      credit_terms,
      creditTerms,
      status
    } = req.body;

    const finalVendorCode = vendor_code || vendorCode || id || `VND-${Date.now()}`;
    const finalCompanyName = company_name || companyName || company;

    if (!finalCompanyName) {
      const err = new Error('Company name is required');
      err.statusCode = 400;
      return next(err);
    }

    const supplier = await db.Supplier.create({
      vendor_code: finalVendorCode,
      company_name: finalCompanyName,
      contact_person: contact_person || contactPerson || contact || null,
      phone: phone || null,
      country: country || 'United Kingdom',
      credit_terms: credit_terms || creditTerms || 'Net 30',
      status: status || 'active'
    });

    const formatted = {
      id: supplier.vendor_code,
      dbId: supplier.id,
      company: supplier.company_name,
      contact: supplier.contact_person || 'N/A',
      phone: supplier.phone || 'N/A',
      country: supplier.country || 'International',
      payable: 0,
      creditTerms: supplier.credit_terms || 'Net 30',
      lastInvoice: 'N/A',
      status: supplier.status || 'active'
    };

    res.status(201).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const paramId = req.params.id;
    let supplier = null;
    if (!isNaN(Number(paramId))) {
      supplier = await db.Supplier.findByPk(Number(paramId));
    }
    if (!supplier) {
      supplier = await db.Supplier.findOne({ where: { vendor_code: String(paramId) } });
    }
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });

    const { company, company_name, companyName, contact, contact_person, contactPerson, creditTerms, credit_terms, phone, country, ...rest } = req.body;

    const updates = {
      ...rest,
      company_name: company_name || companyName || company || supplier.company_name,
      contact_person: contact_person || contactPerson || contact || supplier.contact_person,
      credit_terms: credit_terms || creditTerms || supplier.credit_terms,
      phone: phone !== undefined ? phone : supplier.phone,
      country: country !== undefined ? country : supplier.country
    };

    await supplier.update(updates);
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const paramId = req.params.id;
    let supplier = null;
    if (!isNaN(Number(paramId))) {
      supplier = await db.Supplier.findByPk(Number(paramId));
    }
    if (!supplier) {
      supplier = await db.Supplier.findOne({ where: { vendor_code: String(paramId) } });
    }
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });

    await supplier.destroy();
    res.status(200).json({ success: true, data: { message: 'Supplier deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
