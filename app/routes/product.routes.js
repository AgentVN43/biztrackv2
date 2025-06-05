const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// @route   GET /api/v1/products
router.get('/', authMiddleware, productController.getAllProducts);

// @route   GET /api/v1/products/:id
router.get('/:id', authMiddleware, productController.getProductById);

// @route   POST /api/v1/products
router.post('/', authMiddleware, productController.createProduct);

// @route   PUT /api/v1/products/:id
router.put('/:id', authMiddleware, productController.updateProduct);

// @route   DELETE /api/v1/products/:id
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
