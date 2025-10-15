const db = require("../config/db.config");

// Controller methods follow a consistent pattern:
// 1. Input validation (if not handled by middleware)
// 2. Database operation
// 3. Response handling
// 4. Error handling

/**
 * Get all users
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getAllUsers = (req, res, next) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        u.user_id,
        u.fullname,
        u.username,
        u.email,
        u.phone,
        u.status,
        u.created_at,
        r.role_id,
        r.role_name,
        r.role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (err, results) => {
      if (err) {
        return next(err);
      }

      // Get total count for pagination info
      db.query("SELECT COUNT(*) as total FROM users", (err, countResult) => {
        if (err) {
          return next(err);
        }

        const total = countResult[0].total;

        res.json({
          success: true,
          data: results,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getUserById = (req, res, next) => {
  try {
    const userId = req.params.id;

    // Input validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    db.query(
      `
      SELECT 
        u.user_id, 
        u.fullname, 
        u.username, 
        u.email, 
        u.phone, 
        u.status,
        u.created_at, 
        r.role_id,
        r.role_name,
        r.role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?;
      `,
      [userId],
      (err, results) => {
        if (err) {
          return next(err);
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.json({
          success: true,
          data: results[0],
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.createUser = (req, res, next) => {
  try {
    const { username, email, password, fullname, phone, role_id, status } =
      req.body;

    // Check for duplicate email
    db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email],
      (err, results) => {
        if (err) {
          return next(err);
        }

        if (results.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
          });
        }

        // Insert new user
        const query =
          "INSERT INTO users (user_id, username, email, password, fullname, phone, role_id, status) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)";
        db.query(
          query,
          [
            username,
            email,
            password,
            fullname,
            phone,
            role_id,
            status || "active",
          ],
          (err, result) => {
            if (err) {
              return next(err);
            }

            res.status(201).json({
              success: true,
              message: "User created successfully",
              data: {
                id: result.insertId || null,
                username,
                email,
                fullname,
                phone,
                role_id,
                status: status || "active",
              },
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.updateUser = (req, res, next) => {
  try {
    const userId = req.params.id;
    const { username, email, fullname, phone, role_id } = req.body;
    let { status } = req.body;

    // Check if user exists
    db.query(
      "SELECT user_id, status FROM users WHERE user_id = ?",
      [userId],
      (err, results) => {
        if (err) {
          return next(err);
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const currentUserStatus = results[0].status;
        status = status || currentUserStatus || "active"; // Use provided status, or current, or default to 'active'

        // Update user
        const query =
          "UPDATE users SET username = ?, fullname = ?, email = ?, phone = ?, role_id = ?, status = ? WHERE user_id = ?";
        db.query(
          query,
          [username, fullname, email, phone, role_id, status, userId],
          (err) => {
            if (err) {
              return next(err);
            }

            res.json({
              success: true,
              message: "User updated successfully",
              data: {
                id: userId,
                username,
                email,
                fullname,
                phone,
                role_id,
                status,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.deleteUser = (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    db.query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId],
      (err, results) => {
        if (err) {
          return next(err);
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // Delete user
        db.query("DELETE FROM users WHERE user_id = ?", [userId], (err) => {
          if (err) {
            return next(err);
          }

          res.json({
            success: true,
            message: "User deleted successfully",
          });
        });
      }
    );
  } catch (error) {
    next(error);
  }
};
