const service = require("./payments.service");

exports.createPayment = (req, res, next) => {
  service.createPayment(req.body, (err, payment) => {
    if (err) {
      console.error("Error creating payment:", err);
      return next(err); 
    }
    res.status(201).json({ success: true, data: payment });
  });
};

exports.updatePayment = (req, res, next) => {
  const { id } = req.params;
  service.updatePayment(id, req.body, (err, updatedPayment) => {
    if (err) {
      console.error("Error updating payment:", err);
      return next(err);
    }
    if (!updatedPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    res.json({ success: true, data: updatedPayment });
  });
};

exports.getPaymentById = (req, res, next) => {
  const { id } = req.params;
  service.getPaymentById(id, (err, payment) => {
    if (err) {
      console.error("Error getting payment by ID:", err);
      return next(err);
    }
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    res.json({ success: true, data: payment });
  });
};

exports.getAllPayments = (req, res, next) => {
  service.getAllPayments((err, payments) => {
    if (err) {
      console.error("Error getting all payments:", err);
      return next(err);
    }
    res.json({ success: true, data: payments });
  });
};

exports.deletePayment = (req, res, next) => {
  const { id } = req.params;
  service.deletePayment(id, (err, result) => {
    if (err) {
      console.error("Error deleting payment:", err);
      return next(err);
    }
    if (!result) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    res.json({ success: true, message: 'Payment deleted successfully.' });
  });
};

exports.getPaymentsByPO = (req, res, next) => {
  const { purchase_order_id } = req.params;
  service.getPaymentsByPO(purchase_order_id, (err, payments) => {
    if (err) {
      console.error("Error getting payments by PO:", err);
      return next(err);
    }
    res.json({ success: true, data: payments });
  });
};
