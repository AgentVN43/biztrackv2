const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { validateUser } = require('../middlewares/validation.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', authMiddleware, userController.getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, userController.getUserById);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  Private/Admin
 */
router.post('/', [authMiddleware, validateUser], userController.createUser);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put('/:id', [authMiddleware, validateUser], userController.updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;