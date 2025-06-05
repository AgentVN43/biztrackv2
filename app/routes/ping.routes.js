const router = require('express').Router();
const db = require('../config/db.config');

// GET /api/v1/ping (health check endpoint)
router.get('/', (req, res, next) => {
  try {
    db.query('SELECT 1', (err, result) => {
      if (err) {
        return next(err); // Pass errors to the error handler
      }
      res.json({ 
        success: true, 
        message: "Database connected!", 
        result 
      });
    });
  } catch (error) {
    next(error); // Pass any other errors to the error handler
  }
});

module.exports = router;