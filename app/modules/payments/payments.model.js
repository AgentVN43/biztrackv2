const db = require("../../config/db.config");
const { v4: uuidv4 } = require('uuid');

exports.create = (data, callback) => {
    const payment_id = uuidv4();
    const payment = { payment_id, ...data, payment_date: new Date() };
    db.query('INSERT INTO payments SET ?', payment, (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, { payment_id, ...payment });
        }
    });
};

exports.update = (payment_id, data, callback) => {
    db.query('UPDATE payments SET ? WHERE payment_id = ?', [data, payment_id], callback);
};

exports.findByPOId = (po_id, callback) => {
    db.query('SELECT * FROM payments WHERE po_id = ?', [po_id], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results);
    });
};

exports.getById = (payment_id, callback) => {
    db.query('SELECT * FROM payments WHERE payment_id = ?', [payment_id], (err, results) => {
        callback(err, results && results.length > 0 ? results[0] : null);
    });
};


exports.getAll = (callback) => {
  console.log('Model: Starting getAll payments query...');
  db.query('SELECT * FROM payments', (err, results) => {
    console.log('Model: getAll payments query finished.');
    callback(err, results);
  });
};

exports.delete = (payment_id, callback) => {
    db.query('DELETE FROM payments WHERE payment_id = ?', [payment_id], callback);
};

exports.findByPurchaseOrderId = (purchase_order_id, callback) => {
    db.query('SELECT * FROM payments WHERE purchase_order_id = ?', [purchase_order_id], callback);
};

exports.updateStatusByPO = (purchase_order_id, status, callback) => {
    db.query('UPDATE payments SET status = ? WHERE purchase_order_id = ?', [status, purchase_order_id], callback);
};