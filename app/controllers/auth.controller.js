const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');
/**
 * Register a new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if email already exists
    db.query('SELECT user_id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email is already registered'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate UUID for new user
      const userId = uuidv4();

      // Create user with default role 'user'
      const query = `
        INSERT INTO users 
          (user_id, username, email, password, role, status, created_at)
        VALUES 
          (?, ?, ?, ?, 'user', 'active', NOW())
      `;

      db.query(query, [userId, username, email, hashedPassword], (err) => {
        if (err) {
          return next(err);
        }

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            id: userId,
            username,
            email
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Login user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Lấy user theo email
    const query = `
      SELECT user_id, username, email, password, role 
      FROM users 
      WHERE email = ? 
        AND status = "active"
    `;
    db.query(query, [email], async (err, results) => {
      if (err) return next(err);
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
      }

      const user = results[0];
      // 2) So khớp password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // 3) Tạo Access + Refresh tokens
      const accessToken = jwt.sign(
        { user_id: user.user_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const refreshToken = jwt.sign(
        { id: user.user_id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // 4) Sinh UUID cho refresh_token_id
      const refreshTokenId = uuidv4();

      // 5) Lưu vào bảng refresh_tokens với đúng tên cột
      const tokenQuery = `
        INSERT INTO refresh_tokens 
          (refresh_token_id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
      `;
      db.query(
        tokenQuery,
        [refreshTokenId, user.user_id, refreshToken],
        (err) => {
          if (err) return next(err);

          // 6) Đặt HTTP-only cookie
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });

          // 7) Trả về access token và thông tin user
          res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
              id: user.user_id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user by invalidating refresh token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.logout = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Delete refresh token from database
    db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken], (err) => {
      if (err) {
        return next(err);
      }
      
      // Clear cookie
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getProfile = (req, res, next) => {
  try {
    const { user_id } = req.user;  // dùng user_id

    const query = `
      SELECT user_id, username, email, role, status, created_at, updated_at
      FROM users
      WHERE user_id = ?
    `;

    db.query(query, [user_id], (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: results[0]
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user password
 */
exports.updatePassword = (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { user_id } = req.user;  // dùng user_id

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get current user password
    db.query(
      'SELECT password FROM users WHERE user_id = ?',
      [user_id],
      async (err, results) => {
        if (err) {
          return next(err);
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        const user = results[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in database
        db.query(
          'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
          [hashedPassword, user_id],
          (err) => {
            if (err) {
              return next(err);
            }

            // Revoke all refresh tokens for this user
            db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [user_id], (err) => {
              if (err) {
                return next(err);
              }
              res.json({
                success: true,
                message: 'Password updated successfully. Please login again.'
              });
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};
