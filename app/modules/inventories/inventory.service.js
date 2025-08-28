// const { v4: uuidv4 } = require("uuid");
// const InventoryModel = require("./inventory.model"); // Đổi tên biến để rõ ràng hơn
// const ProductModel = require("../../modules/product/product.model"); // Giả định đường dẫn đến ProductModel
// const ProductService = require("../../modules/product/product.service"); // ✅ Import ProductService

// const InventoryService = {
//   /**
//    * Tạo bản ghi tồn kho mới.
//    * @param {Object} data - Dữ liệu tồn kho.
//    * @param {Function} callback - Callback function.
//    */
//   createInventory: async (data, callback) => {
//     try {
//       const inventory = {
//         inventory_id: uuidv4(),
//         ...data,
//       };

//       const existing = await InventoryModel.findByProductAndWarehouse(
//         data.product_id,
//         data.warehouse_id
//       );

//       if (existing) {
//         return callback(
//           new Error(
//             "Inventory already exists for this product in the warehouse"
//           )
//         );
//       }

//       const result = await InventoryModel.create(inventory);
//       callback(null, result);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: createInventory - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Lấy tất cả các bản ghi tồn kho.
//    * @param {Function} callback - Callback function.
//    */
//   getAllInventories: async (callback) => {
//     try {
//       const inventories = await InventoryModel.findAll();
//       callback(null, inventories);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: getAllInventories - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Lấy bản ghi tồn kho theo ID.
//    * @param {string} id - ID tồn kho.
//    * @param {Function} callback - Callback function.
//    */
//   getInventoryById: async (id, callback) => {
//     try {
//       const inventory = await InventoryModel.findById(id);
//       callback(null, inventory);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: getInventoryById - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Xóa bản ghi tồn kho theo ID.
//    * @param {string} id - ID tồn kho.
//    * @param {Function} callback - Callback function.
//    */
//   deleteInventory: async (id, callback) => {
//     try {
//       const result = await InventoryModel.deleteById(id);
//       callback(null, result);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: deleteInventory - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Cập nhật bản ghi tồn kho.
//    * @param {string} inventory_id - ID tồn kho.
//    * @param {Object} data - Dữ liệu cập nhật.
//    * @param {Function} callback - Callback function.
//    */
//   updateInventory: async (inventory_id, data, callback) => {
//     try {
//       const result = await InventoryModel.update(inventory_id, data);
//       callback(null, result);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: updateInventory - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Lấy tồn kho theo ID kho.
//    * @param {string} id - ID kho.
//    * @param {Function} callback - Callback function.
//    */
//   getByWareHouseId: async (id, callback) => {
//     try {
//       const inventories = await InventoryModel.findByWareHouseId(id);
//       callback(null, inventories);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: getByWareHouseId - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Lấy tất cả tồn kho theo ID kho (trùng lặp với getByWareHouseId, giữ lại nếu có mục đích khác).
//    * @param {string} id - ID kho.
//    * @param {Function} callback - Callback function.
//    */
//   getAllInventoriesByWarehouse: async (id, callback) => {
//     try {
//       const inventories = await InventoryModel.findByWareHouseId(id);
//       callback(null, inventories);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: getAllInventoriesByWarehouse - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Tăng số lượng tồn kho.
//    * @param {string} product_id - ID sản phẩm.
//    * @param {string} warehouse_id - ID kho.
//    * @param {number} quantity - Số lượng cần tăng.
//    * @param {Function} callback - Callback function.
//    */
//   increaseQuantity: async (product_id, warehouse_id, quantity, callback) => {
//     try {
//       // Sử dụng updateQuantitySimple hoặc updateQuantity tùy thuộc vào logic mong muốn
//       const result = await InventoryModel.updateQuantitySimple(
//         product_id,
//         warehouse_id,
//         quantity
//       );
//       callback(null, result);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: increaseQuantity - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Tăng tồn kho từ đơn mua hàng.
//    * @param {Array<Object>} orderDetails - Chi tiết đơn hàng mua.
//    * @param {string} warehouse_id - ID kho.
//    * @param {Function} callback - Callback function.
//    */
//   increaseStockFromPurchaseOrder: async (
//     orderDetails,
//     warehouse_id,
//     callback
//   ) => {
//     try {
//       if (!orderDetails || orderDetails.length === 0) {
//         return callback(new Error("Không có orderDetails"));
//       }

//       for (const { product_id, quantity } of orderDetails) {
//         // Cập nhật products
//         // await ProductService.updateStockFields(
//         //   product_id,
//         //   quantity, // stock += quantity
//         //   0, // reserved_stock giữ nguyên
//         //   quantity // available_stock += quantity
//         // );

//         // Cập nhật inventories
//         const existing = await InventoryModel.findByProductAndWarehouse(
//           product_id,
//           warehouse_id
//         );

//         if (existing) {
//           await InventoryModel.updateQuantity(
//             product_id,
//             warehouse_id,
//             quantity
//           );
//         } else {
//           await InventoryModel.create({
//             inventory_id: uuidv4(),
//             product_id,
//             warehouse_id,
//             quantity,
//             reserved_stock: 0,
//             available_stock: quantity,
//           });
//         }
//       }
//       callback(null);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: increaseStockFromPurchaseOrder - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Giữ tồn kho khi tạo đơn hàng.
//    * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
//    * @param {string} warehouse_id - ID kho.
//    * @param {Function} callback - Callback function.
//    */
//   reserveStockFromOrderDetails: async (
//     orderDetails,
//     warehouse_id,
//     callback
//   ) => {
//     try {
//       if (!orderDetails || orderDetails.length === 0) {
//         return callback(null); // Không có chi tiết để xử lý
//       }

//       for (const { product_id, quantity } of orderDetails) {
//         await InventoryModel.updateReservedAndAvailable(
//           product_id,
//           warehouse_id,
//           quantity, // +reserved
//           -quantity // -available
//         );
//       }
//       callback(null);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: reserveStockFromOrderDetails - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Giải phóng tồn kho đã đặt trước khi hủy đơn hàng.
//    * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
//    * @param {string} warehouse_id - ID kho.
//    * @param {Function} callback - Callback function.
//    */
//   releaseReservedStock: async (orderDetails, warehouse_id, callback) => {
//     try {
//       if (!orderDetails || orderDetails.length === 0) {
//         return callback(null); // Không có chi tiết để xử lý
//       }

//       for (const { product_id, quantity } of orderDetails) {
//         await InventoryModel.updateReservedAndAvailable(
//           product_id,
//           warehouse_id,
//           -quantity, // -reserved
//           quantity // +available
//         );
//       }
//       callback(null);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: releaseReservedStock - Error:",
//         error
//       );
//       callback(error);
//     }
//   },

//   /**
//    * Xác nhận tồn kho đặt trước (chuyển từ reserved sang sold).
//    * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
//    * @param {string} warehouse_id - ID kho.
//    * @returns {Promise<void>} Promise giải quyết khi hoàn thành hoặc từ chối nếu có lỗi.
//    */
//   confirmStockReservation: async (orderDetails, warehouse_id) => {
//     try {
//       for (const { product_id, quantity } of orderDetails) {
//         await InventoryModel.confirmReservation(
//           product_id,
//           warehouse_id,
//           quantity
//         );
//       }
//       // Không cần resolve/reject ở đây vì nó được gọi từ order.service.update
//       // và sẽ được xử lý bởi try/catch của hàm gọi.
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: confirmStockReservation - Error:",
//         error
//       );
//       throw error; // Ném lỗi để được bắt bởi order.service.update
//     }
//   },

//   /**
//    * Giảm tồn kho từ chi tiết đơn hàng (sau khi đơn hàng được hoàn tất).
//    * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
//    * @param {string} warehouse_id - ID kho.
//    * @param {Function} callback - Callback function.
//    */
//   decreaseStockFromOrderDetails: async (
//     orderDetails,
//     warehouse_id,
//     callback
//   ) => {
//     try {
//       if (!orderDetails || orderDetails.length === 0) {
//         return callback(new Error("Không có sản phẩm trong đơn hàng"));
//       }

//       for (const { product_id, quantity } of orderDetails) {
//         // Giảm tồn kho: stock -= quantity
//         await ProductModel.updateStockFromOrderDetails(
//           product_id,
//           -quantity, // ⚠️ Lưu ý là số âm để giảm
//           0, // reserved_stock giữ nguyên (nếu cần có thể tăng)
//           -quantity // available_stock -= quantity
//         );

//         // Cập nhật inventories
//         const existing = await InventoryModel.findByProductAndWarehouse(
//           product_id,
//           warehouse_id
//         );

//         if (existing) {
//           await InventoryModel.updateQuantitySimple(
//             // Sử dụng updateQuantitySimple
//             product_id,
//             warehouse_id,
//             -quantity // giảm tồn kho theo warehouse
//           );
//         } else {
//           return callback(
//             new Error(
//               `Không tìm thấy tồn kho của sản phẩm ${product_id} tại kho ${warehouse_id}`
//             )
//           );
//         }
//       }
//       callback(null);
//     } catch (error) {
//       //console.error(
//         "🚀 ~ inventory.service.js: decreaseStockFromOrderDetails - Error:",
//         error
//       );
//       callback(error);
//     }
//   },
// };

// module.exports = InventoryService;
// inventory.service.js
const { v4: uuidv4 } = require("uuid");
const InventoryModel = require("./inventory.model"); // Đổi tên biến để rõ ràng hơn
const ProductModel = require("../../modules/product/product.model"); // Giả định đây là ProductModel chứa logic DB
const ProductEventModel = require("../product_report/product_event.model");

const InventoryService = {
  /**
   * Tạo bản ghi tồn kho mới.
   * @param {Object} data - Dữ liệu tồn kho.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng tồn kho đã tạo.
   */
  createInventory: async (data) => {
    // ✅ Bỏ tham số `callback`
    try {
      const inventory = {
        inventory_id: uuidv4(),
        ...data,
      };

      const existing = await InventoryModel.findByProductAndWarehouse(
        data.product_id,
        data.warehouse_id
      );

      if (existing) {
        throw new Error( // ✅ Thay callback bằng throw Error
          "Inventory already exists for this product in the warehouse"
        );
      }

      const result = await InventoryModel.create(inventory);
      return result; // ✅ Trả về kết quả
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: createInventory - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Lấy tất cả các bản ghi tồn kho (có thể phân trang).
   * @param {number|null} skip - Số bản ghi bỏ qua (offset).
   * @param {number|null} limit - Số bản ghi lấy về.
   * @returns {Promise<Array|{inventories:Array,total:number}>}
   */
  getAllInventories: async (skip = null, limit = null) => {
    try {
      if (skip !== null && limit !== null) {
        const [inventories, total] = await Promise.all([
          InventoryModel.findAll(skip, limit),
          InventoryModel.countAll(),
        ]);
        return { inventories, total };
      } else {
        const inventories = await InventoryModel.findAll();
        return inventories;
      }
    } catch (error) {
      //console.error("🚀 ~ inventory.service.js: getAllInventories - Error:", error);
      throw error;
    }
  },

  /**
   * Lấy bản ghi tồn kho theo ID.
   * @param {string} id - ID tồn kho.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng tồn kho hoặc null.
   */
  getInventoryById: async (id) => {
    // ✅ Bỏ tham số `callback`
    try {
      const inventory = await InventoryModel.findById(id);
      return inventory; // ✅ Trả về kết quả
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: getInventoryById - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Xóa bản ghi tồn kho theo ID.
   * @param {string} id - ID tồn kho.
   * @returns {Promise<Object>} Promise giải quyết với kết quả xóa.
   */
  deleteInventory: async (id) => {
    // ✅ Bỏ tham số `callback`
    try {
      const result = await InventoryModel.deleteById(id);
      return result; // ✅ Trả về kết quả
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: deleteInventory - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Cập nhật bản ghi tồn kho.
   * @param {string} inventory_id - ID tồn kho.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  updateInventory: async (inventory_id, data) => {
    // ✅ Bỏ tham số `callback`
    try {
      const result = await InventoryModel.update(inventory_id, data);
      return result; // ✅ Trả về kết quả
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: updateInventory - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Lấy tồn kho theo warehouse_id, có thể phân trang.
   * @param {string} warehouse_id
   * @param {number|null} skip
   * @param {number|null} limit
   * @returns {Promise<Array|{inventories:Array,total:number}>}
   */
  getByWareHouseId: async (warehouse_id, skip = null, limit = null) => {
    try {
      if (skip !== null && limit !== null) {
        const [inventories, total] = await Promise.all([
          InventoryModel.findByWareHouseIdWithPagination(warehouse_id, skip, limit),
          InventoryModel.countByWareHouseId(warehouse_id),
        ]);
        return { inventories, total };
      } else {
        const inventories = await InventoryModel.findByWareHouseId(warehouse_id);
        return inventories;
      }
    } catch (error) {
      //console.error("🚀 ~ inventory.service.js: getByWareHouseId - Error:", error);
      throw error;
    }
  },

  /**
   * Lấy tất cả tồn kho theo ID kho (trùng lặp với getByWareHouseId, giữ lại nếu có mục đích khác).
   * @param {string} id - ID kho.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách tồn kho theo kho.
   */
  getAllInventoriesByWarehouse: async (id) => {
    // ✅ Bỏ tham số `callback`
    try {
      const inventories = await InventoryModel.findByWareHouseId(id);
      return inventories; // ✅ Trả về kết quả
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: getAllInventoriesByWarehouse - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Tăng số lượng tồn kho.
   * @param {string} product_id - ID sản phẩm.
   * @param {string} warehouse_id - ID kho.
   * @param {number} quantity - Số lượng cần tăng.
   * @returns {Promise<Object>} Promise giải quyết với kết quả cập nhật.
   */
  increaseQuantity: async (product_id, warehouse_id, quantity) => {
    // ✅ Bỏ tham số `callback`
    try {
      // Sử dụng updateQuantitySimple hoặc updateQuantity tùy thuộc vào logic mong muốn
      const result = await InventoryModel.updateQuantitySimple(
        product_id,
        warehouse_id,
        quantity
      );
      return result; // ✅ Trả về kết quả
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: increaseQuantity - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Tăng tồn kho từ đơn mua hàng.
   * @param {Array<Object>} orderDetails - Chi tiết đơn hàng mua.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<void>} Promise giải quyết khi hoàn thành hoặc từ chối nếu có lỗi.
   */
  increaseStockFromPurchaseOrder: async (orderDetails, warehouse_id) => {
    // Đã sửa ở lần trước
    try {
      if (!orderDetails || orderDetails.length === 0) {
        return;
      }

      for (const { product_id, quantity } of orderDetails) {
        // Cập nhật products (nếu cần, đảm bảo ProductService.updateStockFields trả về Promise)
        // await ProductService.updateStockFields(
        //   product_id,
        //   quantity, // stock += quantity
        //   0, // reserved_stock giữ nguyên
        //   quantity // available_stock += quantity
        // );

        // Cập nhật inventories
        const existing = await InventoryModel.findByProductAndWarehouse(
          product_id,
          warehouse_id
        );

        if (existing) {
          await InventoryModel.update(product_id, warehouse_id, quantity);
        } else {
          // Tạo inventory record mới - total_value sẽ được tự động lấy từ products.cost_price
          await InventoryModel.create({
            inventory_id: uuidv4(),
            product_id,
            warehouse_id,
            quantity,
            reserved_stock: 0,
            available_stock: quantity,
          });
        }
      }
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: increaseStockFromPurchaseOrder - Error:",
        error
      );
      throw error;
    }
  },

  /**
   * Giữ tồn kho khi tạo đơn hàng.
   * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<void>} Promise giải quyết khi hoàn thành hoặc từ chối nếu có lỗi.
   */
  reserveStockFromOrderDetails: async (orderDetails, warehouse_id) => {
    // ✅ Bỏ tham số `callback`
    try {
      if (!orderDetails || orderDetails.length === 0) {
        return; // ✅ Không gọi callback, chỉ return
      }

      for (const { product_id, quantity } of orderDetails) {
        await InventoryModel.updateReservedAndAvailable(
          product_id,
          warehouse_id,
          quantity, // +reserved
          -quantity // -available
        );
      }
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: reserveStockFromOrderDetails - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Giải phóng tồn kho đã đặt trước khi hủy đơn hàng.
   * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<void>} Promise giải quyết khi hoàn thành hoặc từ chối nếu có lỗi.
   */
  releaseReservedStock: async (orderDetails, warehouse_id) => {
    // ✅ Bỏ tham số `callback`
    try {
      if (!orderDetails || orderDetails.length === 0) {
        return; // ✅ Không gọi callback, chỉ return
      }

      for (const { product_id, quantity } of orderDetails) {
        await InventoryModel.updateReservedAndAvailable(
          product_id,
          warehouse_id,
          -quantity, // -reserved
          quantity // +available
        );
      }
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: releaseReservedStock - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  /**
   * Xác nhận tồn kho đặt trước (chuyển từ reserved sang sold).
   * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<void>} Promise giải quyết khi hoàn thành hoặc từ chối nếu có lỗi.
   */
  confirmStockReservation: async (orderDetails, warehouse_id) => {
    // Đã sửa ở lần trước
    try {
      for (const { product_id, quantity } of orderDetails) {
        await InventoryModel.confirmReservation(
          product_id,
          warehouse_id,
          quantity
        );
      }
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: confirmStockReservation - Error:",
        error
      );
      throw error;
    }
  },

  /**
   * Giảm tồn kho từ chi tiết đơn hàng (sau khi đơn hàng được hoàn tất).
   * @param {Array<Object>} orderDetails - Chi tiết đơn hàng.
   * @param {string} warehouse_id - ID kho.
   * @returns {Promise<void>} Promise giải quyết khi hoàn thành hoặc từ chối nếu có lỗi.
   */
  decreaseStockFromOrderDetails: async (orderDetails, warehouse_id) => {
    // ✅ Bỏ tham số `callback`
    try {
      if (!orderDetails || orderDetails.length === 0) {
        throw new Error("Không có sản phẩm trong đơn hàng"); // ✅ Thay callback bằng throw Error
      }

      for (const { product_id, quantity } of orderDetails) {
        // Giảm tồn kho: stock -= quantity
        // Đảm bảo ProductModel.updateStockFromOrderDetails trả về Promise
        await ProductModel.updateStockFromOrderDetails(
          product_id,
          -quantity, // ⚠️ Lưu ý là số âm để giảm
          0, // reserved_stock giữ nguyên (nếu cần có thể tăng)
          -quantity // available_stock -= quantity
        );

        // Cập nhật inventories
        const existing = await InventoryModel.findByProductAndWarehouse(
          product_id,
          warehouse_id
        );

        if (existing) {
          await InventoryModel.updateQuantitySimple(
            product_id,
            warehouse_id,
            -quantity // giảm tồn kho theo warehouse
          );
        } else {
          throw new Error( // ✅ Thay callback bằng throw Error
            `Không tìm thấy tồn kho của sản phẩm ${product_id} tại kho ${warehouse_id}`
          );
        }
      }
    } catch (error) {
      console.error(
        "🚀 ~ inventory.service.js: decreaseStockFromOrderDetails - Error:",
        error
      );
      throw error; // ✅ Ném lỗi
    }
  },

  increaseStockManually: async (product_id, warehouse_id, quantity, reason, initiatedByUserId = null) => {
    if (quantity <= 0) {
      throw new Error("Số lượng tăng phải lớn hơn 0.");
    }

    // Bước 1: Kiểm tra xem bản ghi tồn kho đã tồn tại chưa
    let inventoryRecord = await InventoryModel.findByProductAndWarehouse(
      product_id,
      warehouse_id
    );

    //console.log("inventoryRecord:", inventoryRecord);

    const current_quantity_before = inventoryRecord
      ? inventoryRecord.total_quantity
      : 0;

    //console.log("current_quantity_before:", current_quantity_before);

    let result;
    if (inventoryRecord) {
      // Bước 2: Nếu có, tăng tồn kho bằng hàm đã có
      result = await InventoryModel.update(product_id, warehouse_id, quantity);
    } else {
      // Bước 3: Nếu chưa có, tạo bản ghi tồn kho mới
      inventory_id = uuidv4();
      result = await InventoryModel.create({
        inventory_id,
        product_id,
        warehouse_id,
        quantity,
      });
    }

    // Lấy tồn kho sau khi cập nhật để có current_quantity_after
    const updatedInventory = await InventoryModel.findByProductAndWarehouse(
      product_id,
      warehouse_id
    );

    const current_quantity_after = updatedInventory
      ? updatedInventory.total_quantity
      : 0;
    //console.log("current_quantity_after:", current_quantity_after);
    // initiatedByUserId is now passed as parameter
    // Bước 4: Ghi lại lịch sử điều chỉnh vào inventory_adjustments
    const adjustmentResult = await InventoryModel.recordAdjustment({
      product_id,
      warehouse_id,
      quantity_changed: quantity, // Số lượng thay đổi (luôn là số dương)
      adjustment_type: "increase",
      reason,
      adjusted_by: initiatedByUserId,
      current_quantity_before,
      current_quantity_after,
    });

    // Bước 5: Ghi lại sự kiện vào product_events
    const adjustment_id = adjustmentResult.adjustment_id; // Lấy ID của adjustment vừa tạo
    await ProductEventModel.recordEvent({
      product_id,
      warehouse_id,
      event_type: "STOCK_ADJUSTMENT_INCREASE",
      quantity_impact: quantity, // Số lượng tăng (dương)
      transaction_price: null, // Không có giá giao dịch cho điều chỉnh kho
      partner_name: null,
      current_stock_after: current_quantity_after,
      reference_id: adjustment_id,
      reference_type: "INVENTORY_ADJUSTMENT",
      description: `Điều chỉnh tăng kho: ${reason}`,
      initiated_by: initiatedByUserId,
    });

    return updatedInventory;
  },

  decreaseStockManually: async (product_id, warehouse_id, quantity, reason, initiatedByUserId = null) => {
    if (quantity <= 0) {
      throw new Error("Số lượng giảm phải lớn hơn 0.");
    }

    // Bước 1: Lấy tồn kho hiện tại để kiểm tra
    const currentInventory = await InventoryModel.findByProductAndWarehouse(
      product_id,
      warehouse_id
    );

    //console.log("currentInventory:",currentInventory)

    if (!currentInventory) {
      throw new Error("Không tìm thấy sản phẩm trong kho này.");
    }

    const current_quantity_before = currentInventory
      ? currentInventory.total_quantity
      : 0;

    // Bước 2: Kiểm tra đủ tồn kho khả dụng để giảm
    // Giảm total quantity và available stock
    if (currentInventory.available_stock < quantity) {
      throw new Error("Không đủ tồn kho khả dụng để giảm.");
    }

    // Bước 3: Giảm tồn kho bằng hàm mới
    await InventoryModel.decreaseQuantityAndAvailableStock(
      product_id,
      warehouse_id,
      quantity
    );

    // Bước 4: Ghi lại lịch sử điều chỉnh (RẤT QUAN TRỌNG)
    // Ví dụ: await InventoryAdjustmentModel.recordAdjustment(product_id, warehouse_id, quantity, 'decrease', reason);
    // (Bạn cần tạo InventoryAdjustmentModel và hàm recordAdjustment tương ứng)

    // Sau khi cập nhật, lấy lại bản ghi tồn kho để trả về dữ liệu mới nhất
    const updatedInventory = await InventoryModel.findByProductAndWarehouse(
      product_id,
      warehouse_id
    );
    const current_quantity_after = updatedInventory
      ? updatedInventory.total_quantity
      : 0;

      // initiatedByUserId is now passed as parameter

    // Bước 4: Ghi lại lịch sử điều chỉnh vào inventory_adjustments
    const adjustmentResult = await InventoryModel.recordAdjustment({
      product_id,
      warehouse_id,
      quantity_changed: quantity,
      adjustment_type: "decrease",
      reason,
      adjusted_by: initiatedByUserId,
      current_quantity_before,
      current_quantity_after,
    });

    // Bước 5: Ghi lại sự kiện vào product_events
    const adjustment_id = adjustmentResult.adjustment_id; // Lấy ID của adjustment vừa tạo
    await ProductEventModel.recordEvent({
      product_id,
      warehouse_id,
      event_type: "STOCK_ADJUSTMENT_DECREASE",
      quantity_impact: -quantity, // Số lượng giảm (âm)
      transaction_price: null, // Không có giá giao dịch cho điều chỉnh kho
      partner_name: null,
      current_stock_after: current_quantity_after,
      reference_id: adjustment_id,
      reference_type: "INVENTORY_ADJUSTMENT",
      description: `Điều chỉnh giảm kho: ${reason}`,
      initiated_by: initiatedByUserId,
    });

    return updatedInventory;
  },
};

module.exports = InventoryService;
