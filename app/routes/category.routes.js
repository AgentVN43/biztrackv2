const router = require('express').Router();
const categoryController = require('../controllers/category.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// @route   GET /api/v1/categories
router.get('/', authMiddleware, categoryController.getAllCategories);

// @route   GET /api/v1/categories/:id
router.get('/:id', authMiddleware, categoryController.getCategoryById);

// @route   POST /api/v1/categories
router.post('/', authMiddleware, categoryController.createCategory);

// @route   PUT /api/v1/categories/:id
router.put('/:id', authMiddleware, categoryController.updateCategory);

// @route   DELETE /api/v1/categories/:id
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
