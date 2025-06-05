const { v4: uuidv4 } = require('uuid');
const warehouseModel = require('./warehouse.model');

exports.createWarehouse = (req, res, next) => {
  const warehouse_id = uuidv4();
  const { warehouse_name, warehouse_location, warehouse_capacity } = req.body;

  warehouseModel.createWarehouse({ warehouse_id, warehouse_name, warehouse_location, warehouse_capacity }, (err, result) => {
    if (err) return next(err);
    res.status(201).json({ success: true, message: 'Warehouse created', id: warehouse_id });
  });
};

exports.getAllWarehouses = (req, res, next) => {
  warehouseModel.getAllWarehouses((err, results) => {
    if (err) return next(err);
    res.json({ success: true, data: results });
  });
};

exports.getWarehouseById = (req, res, next) => {
  const { id } = req.params;
  warehouseModel.getWarehouseById(id, (err, results) => {
    if (err) return next(err);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    res.json({ success: true, data: results[0] });
  });
};

exports.updateWarehouse = (req, res, next) => {
  const { id } = req.params;
  const { warehouse_name, warehouse_location, warehouse_capacity } = req.body;

  warehouseModel.updateWarehouse(id, { warehouse_name, warehouse_location, warehouse_capacity }, (err, result) => {
    if (err) return next(err);
    res.json({ success: true, message: 'Warehouse updated' });
  });
};

exports.deleteWarehouse = (req, res, next) => {
  const { id } = req.params;
  warehouseModel.deleteWarehouse(id, (err, result) => {
    if (err) return next(err);
    res.json({ success: true, message: 'Warehouse deleted' });
  });
};
