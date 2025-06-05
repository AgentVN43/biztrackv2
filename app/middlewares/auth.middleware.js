const jwt = require('jsonwebtoken');
const db = require('../config/db.config');

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request object
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid'
        });
      }
      
      // Check if user still exists in database
      const query = 'SELECT user_id, username, email, role FROM users WHERE user_id = ? AND status = "active"';
      db.query(query, [decoded.user_id], (err, results) => {
        if (err) {
          return next(err);
        }
        
        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists or is inactive'
          });
        }
        
        // Attach user to request object
        req.user = results[0];
        next();
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in auth middleware'
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 * 
 * @param {string|string[]} roles - Required role(s)
 * @returns {function} Middleware function
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    // Must be after authMiddleware
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Authorization middleware used without authentication middleware'
      });
    }
    
    // Convert roles to array if string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }
  };
};

/**
 * Refresh token middleware
 * Validates refresh token and issues new access token
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.refreshToken = (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }
      
      // Check if refresh token exists in database
      const query = 'SELECT user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW()';
      db.query(query, [refreshToken], (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Database error while validating refresh token'
          });
        }
        
        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Refresh token has been revoked or expired'
          });
        }
        
        const userId = results[0].user_id;
        
        // Get user data
        const userQuery = 'SELECT user_id, username, email, role FROM users WHERE user_id = ?';
        db.query(userQuery, [userId], (err, userResults) => {
          if (err || userResults.length === 0) {
            return res.status(401).json({
              success: false,
              message: 'User not found'
            });
          }
          
          const user = userResults[0];
          
          // Generate new access token
          const accessToken = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '1h' }
          );
          
          res.json({
            success: true,
            accessToken,
            user: {
              id: user.user_id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in refresh token middleware'
    });
  }
};