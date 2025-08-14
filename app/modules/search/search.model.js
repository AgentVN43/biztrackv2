const db = require("../../config/db.config");

const CustomerModel = {
  findByPhone: async (phone, skip, limit) => {
    const query = `
      SELECT
        customer_id,
        customer_name,
        email,
        created_at,
        updated_at,
        phone,
        total_expenditure,
        status,
        total_orders,
        debt
      FROM customers
      WHERE phone LIKE ?
      LIMIT ? OFFSET ?
    `;
    const searchTerm = `${phone}%`;

    try {
      const [results] = await db
        .promise()
        .query(query, [searchTerm, limit, skip]);
      return results.map((row) => ({
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        email: row.email,
        created_at: row.created_at,
        updated_at: row.updated_at,
        phone: row.phone,
        total_expenditure: row.total_expenditure,
        status: row.status,
        total_orders: row.total_orders,
        debt: Number(row.debt),
      }));
    } catch (error) {
      console.error(
        "Lỗi khi tìm khách hàng theo số điện thoại (có pagination):",
        error.message
      );
      throw error;
    }
  },

  countByPhone: async (phone) => {
    const query = `
      SELECT COUNT(*) AS total
      FROM customers
      WHERE phone LIKE ?
    `;
    const searchTerm = `${phone}%`;

    try {
      const [results] = await db.promise().query(query, [searchTerm]);
      return results[0].total;
    } catch (error) {
      console.error(
        "Lỗi khi đếm khách hàng theo số điện thoại:",
        error.message
      );
      throw error;
    }
  },

  findByName: async (name, skip, limit) => {
    const query = `
      SELECT
        customer_id,
        customer_name,
        email,
        created_at,
        updated_at,
        phone,
        total_expenditure,
        status,
        total_orders,
        debt
      FROM customers
      WHERE customer_name LIKE ?
      LIMIT ? OFFSET ?
    `;
    const searchTerm = `%${name}%`;

    try {
      const [results] = await db
        .promise()
        .query(query, [searchTerm, limit, skip]);
      return results.map((row) => ({
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        email: row.email,
        created_at: row.created_at,
        updated_at: row.updated_at,
        phone: row.phone,
        total_expenditure: row.total_expenditure,
        status: row.status,
        total_orders: row.total_orders,
        debt: Number(row.debt),
      }));
    } catch (error) {
      console.error(
        "Lỗi khi tìm khách hàng theo tên (có pagination):",
        error.message
      );
      throw error;
    }
  },

  countByName: async (name) => {
    const query = `
      SELECT COUNT(*) AS total
      FROM customers
      WHERE customer_name LIKE ?
    `;
    const searchTerm = `%${name}%`;

    try {
      const [results] = await db.promise().query(query, [searchTerm]);
      return results[0].total;
    } catch (error) {
      console.error(
        "Lỗi khi đếm khách hàng theo tên:",
        error.message
      );
      throw error;
    }
  },
};

const OrderModel = {
  // findByCustomerId: async (customerId) => {
  //   const sql =
  //     "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC";
  //   try {
  //     const [rows] = await db.promise().query(sql, [customerId]);
  //     return rows;
  //   } catch (error) {
  //     //console.error("Lỗi khi tìm đơn hàng theo customer ID:", error.message);
  //     throw error;
  //   }
  // },
  // Xịn ko phân trang
  findByCustomerId: async (customerId) => {
    const sql = `
      SELECT
        orders.*,
        customers.customer_name
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.customer_id
      WHERE orders.customer_id = ? AND orders.is_active = 1
      ORDER BY orders.order_date DESC
    `;

    try {
      const [results] = await db.promise().query(sql, [customerId]);

      // Định dạng lại kết quả
      const formattedResults = results.map((order) => ({
        order_id: order.order_id,
        order_code: order.order_code,
        order_date: order.order_date,
        order_status: order.order_status,
        shipping_address: order.shipping_address,
        shipping_fee: order.shipping_fee,
        payment_method: order.payment_method,
        note: order.note,
        total_amount: order.total_amount,
        discount_amount: order.discount_amount,
        final_amount: order.final_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        warehouse_id: order.warehouse_id,
        customer: {
          customer_id: order.customer_id,
          customer_name: order.customer_name || "Khách lẻ",
        },
      }));
      return { orders: formattedResults, total: formattedResults.length };
    } catch (error) {
      console.error(
        "Lỗi khi tìm đơn hàng theo customer ID (có phân trang):",
        error.message
      );
      throw error;
    }
  },

  findByCustomerName: async (customerName, skip, limit) => {
    const sql = `
      SELECT
        orders.*,
        customers.customer_name
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.customer_id
      WHERE customers.customer_name LIKE ? AND orders.is_active = 1
      ORDER BY orders.order_date DESC
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.customer_id
      WHERE customers.customer_name LIKE ? AND orders.is_active = 1
    `;
    const searchTerm = `%${customerName}%`;

    try {
      const [results] = await db.promise().query(sql, [searchTerm, limit, skip]);
      const [countResult] = await db.promise().query(countSql, [searchTerm]);

      // Định dạng lại kết quả
      const formattedResults = results.map((order) => ({
        order_id: order.order_id,
        order_code: order.order_code,
        order_date: order.order_date,
        order_status: order.order_status,
        shipping_address: order.shipping_address,
        shipping_fee: order.shipping_fee,
        payment_method: order.payment_method,
        note: order.note,
        total_amount: order.total_amount,
        discount_amount: order.discount_amount,
        final_amount: order.final_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        warehouse_id: order.warehouse_id,
        customer: {
          customer_id: order.customer_id,
          customer_name: order.customer_name || "Khách lẻ",
        },
      }));

      return { orders: formattedResults, total: countResult[0].total };
    } catch (error) {
      console.error(
        "Lỗi khi tìm đơn hàng theo tên khách hàng:",
        error.message
      );
      throw error;
    }
  },
};

const ProductModel = {
  findByName: async (productName, limit, skip) => {
    const sql = `
      SELECT
        p.product_id, p.product_name, p.product_desc, p.product_image,
        p.product_retail_price, p.product_note, p.product_barcode,
        p.sku, p.is_active, p.category_id, c.category_name, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_name LIKE ?
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_name LIKE ?
    `;
    const searchValue = `%${productName}%`;

    try {
      const [products] = await db
        .promise()
        .query(sql, [searchValue, limit, skip]);
      const [countResult] = await db.promise().query(countSql, [searchValue]);
      const total = countResult[0].total;
      return { products, total };
    } catch (error) {
      console.error(
        "Lỗi khi tìm sản phẩm theo tên (có phân trang):",
        error.message
      );
      throw error;
    }
  },

  findBySku: async (sku, limit, skip) => {
    const sql = `
      SELECT
        p.product_id, p.product_name, p.product_desc, p.product_image,
        p.product_retail_price, p.product_note, p.product_barcode,
        p.sku, p.is_active, p.category_id, c.category_name, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.sku LIKE ?
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.sku LIKE ?
    `;
    const searchValue = `%${sku}%`;

    try {
      const [products] = await db
        .promise()
        .query(sql, [searchValue, limit, skip]);
      const [countResult] = await db.promise().query(countSql, [searchValue]);
      const total = countResult[0].total;
      return { products, total };
    } catch (error) {
      console.error(
        "Lỗi khi tìm sản phẩm theo SKU (có phân trang):",
        error.message
      );
      throw error;
    }
  },

  searchByQuery: async (q, limit, skip) => {
    // Nếu q không chứa khoảng trắng và có vẻ là mã SKU
    if (/^[\w\-]+$/.test(q) && !q.match(/\s/)) {
      // Tìm theo cả SKU và tên sản phẩm
      const sql = `
        SELECT
          p.product_id, p.product_name, p.product_desc, p.product_image,
          p.product_retail_price, p.product_note, p.product_barcode,
          p.sku, p.is_active, p.category_id, c.category_name, p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.sku LIKE ? OR p.product_name LIKE ?
        LIMIT ? OFFSET ?
      `;
      const countSql = `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.sku LIKE ? OR p.product_name LIKE ?
      `;
      const searchValue = `%${q}%`;

      try {
        const [products] = await db
          .promise()
          .query(sql, [searchValue, searchValue, limit, skip]);
        const [countResult] = await db.promise().query(countSql, [searchValue, searchValue]);
        const total = countResult[0].total;
        return { products, total };
      } catch (error) {
        console.error(
          "Lỗi khi tìm sản phẩm theo query (có phân trang):",
          error.message
        );
        throw error;
      }
    } else {
      // Tìm theo tên sản phẩm
      const sql = `
        SELECT
          p.product_id, p.product_name, p.product_desc, p.product_image,
          p.product_retail_price, p.product_note, p.product_barcode,
          p.sku, p.is_active, p.category_id, c.category_name, p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_name LIKE ?
        LIMIT ? OFFSET ?
      `;
      const countSql = `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_name LIKE ?
      `;
      const searchValue = `%${q}%`;

      try {
        const [products] = await db
          .promise()
          .query(sql, [searchValue, limit, skip]);
        const [countResult] = await db.promise().query(countSql, [searchValue]);
        const total = countResult[0].total;
        return { products, total };
      } catch (error) {
        console.error(
          "Lỗi khi tìm sản phẩm theo tên (có phân trang):",
          error.message
        );
        throw error;
      }
    }
  },
};

const CategoryModel = {
  findByName: async (name, skip, limit) => {
    const query = `
      SELECT
        category_id,
        category_name,
        status
      FROM categories
      WHERE category_name LIKE ?
      LIMIT ? OFFSET ?
    `;
    const searchTerm = `%${name}%`;

    try {
      const [results] = await db
        .promise()
        .query(query, [searchTerm, limit, skip]);
      return results.map((row) => ({
        category_id: row.category_id,
        category_name: row.category_name,
        status: row.status,
      }));
    } catch (error) {
      console.error(
        "Lỗi khi tìm danh mục theo tên (có pagination):",
        error.message
      );
      throw error;
    }
  },

  countByName: async (name) => {
    const query = `
      SELECT COUNT(*) AS total
      FROM categories
      WHERE category_name LIKE ?
    `;
    const searchTerm = `%${name}%`;

    try {
      const [results] = await db.promise().query(query, [searchTerm]);
      return results[0].total;
    } catch (error) {
      console.error(
        "Lỗi khi đếm danh mục theo tên:",
        error.message
      );
      throw error;
    }
  },
};

const WarehouseModel = {
  findByName: async (name, skip, limit) => {
    const query = `
      SELECT
        warehouse_id,
        warehouse_name,
        warehouse_location,
        warehouse_capacity
      FROM warehouses
      WHERE warehouse_name LIKE ?
      LIMIT ? OFFSET ?
    `;
    const searchTerm = `%${name}%`;

    try {
      const [results] = await db
        .promise()
        .query(query, [searchTerm, limit, skip]);
      return results.map((row) => ({
        warehouse_id: row.warehouse_id,
        warehouse_name: row.warehouse_name,
        warehouse_location: row.warehouse_location,
        warehouse_capacity: row.warehouse_capacity,
      }));
    } catch (error) {
      console.error(
        "Lỗi khi tìm kho theo tên (có pagination):",
        error.message
      );
      throw error;
    }
  },

  countByName: async (name) => {
    const query = `
      SELECT COUNT(*) AS total
      FROM warehouses
      WHERE warehouse_name LIKE ?
    `;
    const searchTerm = `%${name}%`;

    try {
      const [results] = await db.promise().query(query, [searchTerm]);
      return results[0].total;
    } catch (error) {
      console.error(
        "Lỗi khi đếm kho theo tên:",
        error.message
      );
      throw error;
    }
  },
};

const InventoryModel = {
  searchByProductQueryAndWarehouse: async (q, warehouseName, status, skip, limit) => {
    let whereConditions = [];
    let params = [];

    // Tìm kiếm theo sản phẩm (tên hoặc SKU)
    if (q) {
      // Nếu q không chứa khoảng trắng và có vẻ là mã SKU
      if (/^[\w\-]+$/.test(q) && !q.match(/\s/)) {
        whereConditions.push("(p.sku LIKE ? OR p.product_name LIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
      } else {
        whereConditions.push("p.product_name LIKE ?");
        params.push(`%${q}%`);
      }
    }

    // Tìm kiếm theo tên kho
    if (warehouseName) {
      whereConditions.push("w.warehouse_name LIKE ?");
      params.push(`%${warehouseName}%`);
    }

    // Tìm kiếm theo trạng thái tồn kho
    if (status) {
      switch (status.toLowerCase()) {
        case 'in_stock':
          whereConditions.push("i.quantity > 0");
          break;
        case 'out_of_stock':
          whereConditions.push("i.quantity = 0");
          break;
        case 'low_stock':
          whereConditions.push("i.quantity > 0 AND i.quantity <= 10");
          break;
        case 'available':
          whereConditions.push("i.available_stock > 0");
          break;
        case 'reserved':
          whereConditions.push("i.reserved_stock > 0");
          break;
        default:
          break;
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        i.inventory_id,
        i.quantity,
        i.reserved_stock,
        i.available_stock,
        i.created_at,
        i.updated_at,
        p.product_id,
        p.product_name,
        p.sku,
        p.product_image,
        p.product_retail_price,
        p.is_active,
        c.category_id,
        c.category_name,
        w.warehouse_id,
        w.warehouse_name,
        w.warehouse_location,
        w.warehouse_capacity
      FROM inventories i
      JOIN products p ON i.product_id = p.product_id
      JOIN warehouses w ON i.warehouse_id = w.warehouse_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${whereClause}
      ORDER BY p.product_name ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM inventories i
      JOIN products p ON i.product_id = p.product_id
      JOIN warehouses w ON i.warehouse_id = w.warehouse_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${whereClause}
    `;

    try {
      const [results] = await db.promise().query(query, [...params, limit, skip]);
      const [countResult] = await db.promise().query(countQuery, params);

      const formattedResults = results.map((row) => ({
        inventory_id: row.inventory_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        product: {
          product_id: row.product_id,
          sku: row.sku,
          product_image: row.product_image,
          product_name: row.product_name,
          product_retail_price: row.product_retail_price,
          quantity: row.quantity,
          reserved_stock: row.reserved_stock,
          available_stock: row.available_stock,
          category: row.category_id
            ? {
              category_id: row.category_id,
              category_name: row.category_name,
            }
            : null,
        },
        warehouse: {
          warehouse_id: row.warehouse_id,
          warehouse_name: row.warehouse_name,
        },
      }));

      return { inventories: formattedResults, total: countResult[0].total };
    } catch (error) {
      console.error(
        "Lỗi khi tìm kiếm tồn kho (có pagination):",
        error.message
      );
      throw error;
    }
  },
};

module.exports = {
  CustomerModel,
  OrderModel,
  ProductModel,
  CategoryModel,
  WarehouseModel,
  InventoryModel,
};
