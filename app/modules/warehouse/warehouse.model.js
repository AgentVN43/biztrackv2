const db = require('../../config/db.config');

exports.createWarehouse = (data, callback) => {
  const { warehouse_id, warehouse_name, warehouse_location, warehouse_capacity } = data;
  const query = 'INSERT INTO warehouses (warehouse_id, warehouse_name, warehouse_location, warehouse_capacity) VALUES (?, ?, ?, ?)';
  db.query(query, [warehouse_id, warehouse_name, warehouse_location, warehouse_capacity], callback);
};

exports.getAllWarehouses = (callback) => {
  const query = 'SELECT * FROM warehouses';
  db.query(query, callback);
};

exports.getWarehouseById = (id, callback) => {
  const query = 'SELECT * FROM warehouses WHERE warehouse_id = ?';
  db.query(query, [id], callback);
};

exports.updateWarehouse = (id, data, callback) => {
  const { warehouse_name, warehouse_location, warehouse_capacity } = data;
  const query = `
    UPDATE warehouses 
    SET warehouse_name = ?, warehouse_location = ?, warehouse_capacity = ?
    WHERE warehouse_id = ?
  `;
  db.query(query, [warehouse_name, warehouse_location, warehouse_capacity, id], callback);
};

exports.deleteWarehouse = (id, callback) => {
  const query = 'DELETE FROM warehouses WHERE warehouse_id = ?';
  db.query(query, [id], callback);
};
