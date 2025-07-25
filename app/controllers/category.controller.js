const db = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

exports.getAllCategories = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;
  // Đếm tổng số bản ghi
  db.query('SELECT COUNT(*) AS total FROM categories', (err, countResult) => {
    if (err) return next(err);
    const total = countResult[0].total;
    db.query(
      'SELECT category_id, category_name, status FROM categories LIMIT ? OFFSET ?',
      [parsedLimit, skip],
      (err, results) => {
        if (err) return next(err);
        res.json({
          success: true,
          data: results,
          pagination: {
            total,
            currentPage: parsedPage,
            pageSize: parsedLimit,
            totalPages: Math.ceil(total / parsedLimit)
          }
        });
      }
    );
  });
};

exports.getCategoryById = (req, res, next) => {
  const id = req.params.id;
  db.query(
    'SELECT category_id, category_name, status FROM categories WHERE category_id = ?',
    [id],
    (err, results) => {
      if (err) return next(err);
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, data: results[0] });
    }
  );
};

exports.createCategory = (req, res, next) => {
  const { category_name, status = 'active' } = req.body;
  const category_id = uuidv4(); // tạo UUID từ Node.js

  db.query(
    'INSERT INTO categories (category_id, category_name, status) VALUES (?, ?, ?)',
    [category_id, category_name, status],
    (err, result) => {
      if (err) return next(err);
      res.status(201).json({
        success: true,
        message: 'Category created',
        data: { category_id, category_name, status }
      });
    }
  );
};

exports.updateCategory = (req, res, next) => {
  const id = req.params.id;
  const { category_name, status } = req.body;
  db.query(
    'UPDATE categories SET category_name = ?, status = ? WHERE category_id = ?',
    [category_name, status, id],
    (err) => {
      if (err) return next(err);
      res.json({ success: true, message: 'Category updated' });
    }
  );
};

exports.deleteCategory = (req, res, next) => {
  const id = req.params.id;
  db.query('DELETE FROM categories WHERE category_id = ?', [id], (err) => {
    if (err) return next(err);
    res.json({ success: true, message: 'Category deleted' });
  });
};
