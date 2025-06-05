const db = require("../config/db.config");

exports.getAllProducts = (req, res, next) => {
  db.query(
    `
    SELECT 
      p.product_id, p.product_name, p.product_desc, p.product_image, 
      p.product_retail_price, p.product_note, p.product_barcode, 
      p.sku, p.is_active, p.category_id, c.category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
  `,
    (err, results) => {
      if (err) return next(err);
      res.json({ success: true, data: results });
    }
  );
};

exports.getProductById = (req, res, next) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM products WHERE product_id = ?",
    [id],
    (err, results) => {
      if (err) return next(err);
      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, data: results[0] });
    }
  );
};

exports.createProduct = (req, res, next) => {
  const {
    product_name,
    product_desc,
    product_image,
    product_retail_price,
    product_note,
    product_barcode,
    sku,
    is_active,
    category_id,
  } = req.body;

  db.query(
    "SELECT category_id FROM categories WHERE category_id = ?",
    [category_id],
    (err, result) => {
      if (err) return next(err);
      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid category_id: Category does not exist",
        });
      }

      db.query(
        `INSERT INTO products (
        product_id, product_name, product_desc, product_image,
        product_retail_price, product_note, product_barcode,
        sku, is_active, category_id
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_name,
          product_desc,
          product_image,
          product_retail_price,
          product_note,
          product_barcode,
          sku,
          is_active,
          category_id,
        ],
        (err, result) => {
          if (err) return next(err);
          res.status(201).json({ success: true, message: "Product created" });
        }
      );
    }
  );
};

exports.updateProduct = (req, res, next) => {
  const id = req.params.id;
  const {
    product_name,
    product_desc,
    product_image,
    product_retail_price,
    product_note,
    product_barcode,
    sku,
    is_active,
    category_id,
  } = req.body;

  db.query(
    "SELECT category_id FROM categories WHERE category_id = ?",
    [category_id],
    (err, result) => {
      if (err) return next(err);
      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid category_id: Category does not exist",
        });
      }

      db.query(
        `UPDATE products SET 
        product_name = ?, product_desc = ?, product_image = ?,
        product_retail_price = ?, product_note = ?, product_barcode = ?,
        sku = ?, is_active = ?, category_id = ?
      WHERE product_id = ?`,
        [
          product_name,
          product_desc,
          product_image,
          product_retail_price,
          product_note,
          product_barcode,
          sku,
          is_active,
          category_id,
          id,
        ],
        (err) => {
          if (err) return next(err);
          res.json({ success: true, message: "Product updated" });
        }
      );
    }
  );
};

exports.deleteProduct = (req, res, next) => {
  const id = req.params.id;
  db.query("DELETE FROM products WHERE product_id = ?", [id], (err) => {
    if (err) return next(err);
    res.json({ success: true, message: "Product deleted" });
  });
};

exports.updateStockFields = (
  product_id,
  stockChange,
  reservedChange,
  availableChange,
  callback
) => {
  const sql = `
    UPDATE products
    SET 
      stock = stock + ?,
      reserved_stock = reserved_stock + ?,
      available_stock = available_stock + ?
    WHERE product_id = ?
  `;
  db.query(
    sql,
    [stockChange, reservedChange, availableChange, product_id],
    (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    }
  );
};
