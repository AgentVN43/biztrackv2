const Payment = require('./payments.model');
const CustomerService = require("../customers/customer.service");

exports.createPayment = (data, callback) => {
  Payment.create(data, async (err, payment) => {
    if (err) {
      callback(err);
    } else {
      // Sau khi ghi nhận thanh toán, giảm debt cho khách hàng
      if (payment && payment.customer_id) {
        try {
          const CustomerModel = require("../customers/customer.model");
          const debt = await CustomerModel.calculateDebt(payment.customer_id);
          await CustomerModel.update(payment.customer_id, { debt });
        } catch (debtErr) {
          // Ghi log nhưng không làm fail thanh toán
          console.error("Lỗi khi cập nhật debt cho khách hàng sau thanh toán:", debtErr);
        }
      }
      callback(null, payment);
    }
  });
};

exports.updatePayment = (payment_id, data, callback) => {
  Payment.update(payment_id, data, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
};

exports.getPaymentById = (payment_id, callback) => {
  Payment.getById(payment_id, (err, payment) => {
    if (err) {
      callback(err);
    } else {
      callback(null, payment);
    }
  });
};

exports.getAllPayments = (callback) => {
  console.log('Service: Calling Payment.getAll...');
  Payment.getAll((err, results) => {
    console.log('Service: Payment.getAll callback called.'); // Để debug
    if (err) {
      callback(err);
    } else {
      callback(null, results);
    }
  });
};

exports.deletePayment = (payment_id, callback) => {
  Payment.delete(payment_id, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
};

exports.getPaymentsByPO = (po_id, callback) => {
  Payment.findByPurchaseOrderId(po_id, (err, results) => {
    if (err) {
      callback(err);
    } else {
      callback(null, results);
    }
  });
};

exports.updatePaymentStatusByPO = (po_id, status, callback) => {
  Payment.updateStatusByPO(po_id, status, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(null, result);
    }
  });
};

// Các hàm service phục vụ logic nghiệp vụ tự động (đã triển khai ở phiên trước)
exports.createPaymentOnPOCreation = (po_id, amount, callback) => { // Thêm callback
  const paymentData = {
    po_id,
    amount,
    payment_code: `PC-${Date.now()}`,
    status: 'Mới'
  };
  this.createPayment(paymentData, callback); // Sử dụng callback
};

exports.updatePaymentStatusOnPOCompletion = (po_id, callback) => { // Thêm callback
  this.updatePaymentStatusByPO(po_id, 'Đã chi', callback); // Sử dụng callback
};
