const { v4: uuidv4 } = require('uuid');
const WarehouseModel = require('./warehouse.model');

const WarehouseService = {
  createWarehouse: (warehouseData, callback) => {
    WarehouseModel.findByName(warehouseData.warehouse_name, (err, results) => {
      if (err) return callback(err);

      if (results.length > 0) {
        return callback(null, {
          conflict: true,
          message: 'Warehouse already exists'
        });
      }

      const newWarehouse = {
        warehouse_id: uuidv4(),
        ...warehouseData
      };

      WarehouseModel.create(newWarehouse, (err, result) => {
        if (err) return callback(err);

        callback(null, {
          conflict: false,
          data: {
            id: newWarehouse.warehouse_id,
            ...warehouseData
          }
        });
      });
    });
  }
};

module.exports = WarehouseService;
