/**
 * Validation middleware for user-related requests
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.validateUser = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];
    
    // Validate username
    if (!username || username.trim() === '') {
      errors.push('Username is required');
    } else if (username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    
    // Validate email
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Email is invalid');
      }
    }
    
    // Validate password (only for create or password update)
    if (req.method === 'POST' || (req.method === 'PUT' && req.body.password)) {
      if (!password) {
        errors.push('Password is required');
      } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
    }
    
    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // If validation passes, proceed to the next middleware/controller
    next();
  };