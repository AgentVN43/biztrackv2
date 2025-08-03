const ProductEventModel = require("./product_event.model"); // Đảm bảo đường dẫn đúng
const ProductModel = require("../product/product.model");
const WarehouseModel = require('../warehouse/warehouse.model');


const ProductReportService = {
  /**
   * Tạo báo cáo lịch sử chi tiết cho một sản phẩm cụ thể.
   * Báo cáo này tổng hợp thông tin từ các sự kiện đã ghi nhận trong product_events.
   *
   * @param {string} product_id - ID của sản phẩm cần tạo báo cáo.
   * @returns {Promise<Array<Object>>} Promise giải quyết với một mảng các đối tượng lịch sử đã định dạng.
   * Mỗi đối tượng bao gồm: chung_tu, thoi_gian, loai_giao_dich,
   * doi_tac, gia_gd, so_luong, ton_cuoi.
   */
  getProductHistoryReport: async (product_id) => {
    try {
      const events = await ProductEventModel.getEventsByProductId(product_id);

      if (!events || events.length === 0) {
        return []; // Trả về mảng rỗng nếu không có sự kiện nào
      }

      // Tính toán tồn kho cuối chính xác dựa trên quantity_impact
      // Sắp xếp events theo thời gian tăng dần (cũ nhất trước) để tính toán đúng
      const sortedEvents = events.sort((a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp));
      
      let runningStock = 0; // Tồn kho chạy
      const reportWithCalculatedStock = sortedEvents.map((event) => {
        // Cập nhật tồn kho chạy dựa trên quantity_impact
        // quantity_impact: dương = tăng kho, âm = giảm kho
        runningStock += parseFloat(event.quantity_impact || 0);
        
        let loai_giao_dich;
        // Map event_type sang định dạng tiếng Việt mong muốn
        switch (event.event_type) {
          case "ORDER_SOLD":
            loai_giao_dich = "Bán hàng";
            break;
          case "PO_RECEIVED":
            loai_giao_dich = "Nhập hàng";
            break;
          case "STOCK_ADJUSTMENT_INCREASE":
            loai_giao_dich = "Điều chỉnh tăng kho";
            break;
          case "STOCK_ADJUSTMENT_DECREASE":
            loai_giao_dich = "Điều chỉnh giảm kho";
            break;
          case "RETURN_FROM_CUSTOMER":
            loai_giao_dich = "Khách hàng trả hàng";
            break;
          case "RETURN_TO_SUPPLIER":
            loai_giao_dich = "Trả hàng nhà cung cấp";
            break;
          default:
            loai_giao_dich = "Giao dịch khác";
        }

        return {
          chung_tu: event.reference_id,
          thoi_gian: event.event_timestamp,
          loai_giao_dich: loai_giao_dich,
          doi_tac: event.partner_name || "N/A",
          gia_gd: event.transaction_price || 0,
          so_luong: event.quantity_impact,
          ton_cuoi: runningStock, // Sử dụng tồn kho đã tính toán
          mo_ta: event.description,
        };
      });

      // Sắp xếp lại theo thời gian giảm dần (mới nhất trước) để hiển thị
      return reportWithCalculatedStock.sort((a, b) => new Date(b.thoi_gian) - new Date(a.thoi_gian));
    } catch (error) {
      console.error(
        "🚀 ~ ProductReportService: getProductHistoryReport - Error:",
        error
      );
      throw error; // Ném lỗi để controller xử lý
    }
  },

  getProductHistoryByProductAndWarehouse: async (product_id, warehouse_id) => {
    try {
      // Gọi hàm model mới để lấy sự kiện theo sản phẩm và kho
      const events = await ProductEventModel.getEventsByProductAndWarehouseId(
        product_id,
        warehouse_id
      );

      if (!events || events.length === 0) {
        return [];
      }

      // Lấy thông tin chi tiết về sản phẩm
      const productInfo = await ProductModel.getProductById(product_id);
      const productName = productInfo
        ? productInfo.product_name
        : `Sản phẩm ${product_id}`;

      // Lấy tên kho
      const warehouseInfo = await WarehouseModel.getById(warehouse_id);
      const warehouseName = warehouseInfo
        ? warehouseInfo.warehouse_name
        : `Kho ${warehouse_id}`;

      // Tính toán tồn kho cuối chính xác dựa trên quantity_impact
      // Sắp xếp events theo thời gian tăng dần (cũ nhất trước) để tính toán đúng
      const sortedEvents = events.sort((a, b) => new Date(a.event_timestamp) - new Date(b.event_timestamp));
      
      let runningStock = 0; // Tồn kho chạy
      const reportWithCalculatedStock = sortedEvents.map((event) => {
        // Cập nhật tồn kho chạy dựa trên quantity_impact
        // quantity_impact: dương = tăng kho, âm = giảm kho
        runningStock += parseFloat(event.quantity_impact || 0);
        
        let loai_giao_dich;
        switch (event.event_type) {
          case "ORDER_SOLD":
            loai_giao_dich = "Bán hàng";
            break;
          case "PO_RECEIVED":
            loai_giao_dich = "Nhập hàng";
            break;
          case "STOCK_ADJUSTMENT_INCREASE":
            loai_giao_dich = "Điều chỉnh tăng kho";
            break;
          case "STOCK_ADJUSTMENT_DECREASE":
            loai_giao_dich = "Điều chỉnh giảm kho";
            break;
          case "ORDER_CANCELLED":
            loai_giao_dich = "Huỷ đơn hàng";
            break;
          case "RETURN_FROM_CUSTOMER":
            loai_giao_dich = "Khách hàng trả hàng";
            break;
          case "RETURN_TO_SUPPLIER":
            loai_giao_dich = "Trả hàng nhà cung cấp";
            break;
          default:
            loai_giao_dich = "Giao dịch khác";
        }

        return {
          chung_tu: event.reference_id,
          thoi_gian: event.event_timestamp,
          loai_giao_dich: loai_giao_dich,
          doi_tac: event.partner_name || "N/A",
          gia_gd: event.transaction_price || 0,
          so_luong: event.quantity_impact,
          ton_cuoi: runningStock, // Sử dụng tồn kho đã tính toán
          mo_ta: event.description,
          product_name: productName,
          warehouse_name: event.warehouse_name || warehouseName,
          warehouse_id: event.warehouse_id,
        };
      });

      // Sắp xếp lại theo thời gian giảm dần (mới nhất trước) để hiển thị
      return reportWithCalculatedStock.sort((a, b) => new Date(b.thoi_gian) - new Date(a.thoi_gian));
    } catch (error) {
      console.error(
        "🚀 ~ ProductReportService: getProductHistoryByProductAndWarehouse - Lỗi:",
        error
      );
      throw error;
    }
  },
};

module.exports = ProductReportService;
