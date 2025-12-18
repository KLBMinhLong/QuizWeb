var jwt = require("jsonwebtoken");
var config = require(global.__basedir + "/Config/Setting.json");

// Ưu tiên lấy JWT secret từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET || config.auth.jwtSecret;

/**
 * Verify JWT token từ cookie hoặc header
 * @param {string} token - JWT token string
 * @returns {object|null} - Decoded payload nếu hợp lệ, null nếu không hợp lệ
 */
function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Token expired, invalid, etc.
    return null;
  }
}

/**
 * Middleware để verify token từ cookie
 * Nếu hợp lệ, gắn thông tin user vào req.user
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).redirect("/auth/login");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie("token");
    return res.status(401).redirect("/auth/login");
  }

  // Gắn thông tin user vào request để dùng ở các route tiếp theo
  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role,
  };

  next();
}

/**
 * Middleware để yêu cầu role admin
 * Phải dùng sau requireAuth
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).redirect("/auth/login");
  }

  // Kiểm tra role trong token (sẽ được mở rộng sau khi có UserRole)
  if (req.user.role !== "admin") {
    return res.status(403).send("Bạn không có quyền truy cập trang này");
  }

  next();
}

/**
 * Middleware optional auth - không bắt buộc đăng nhập
 * Nếu có token hợp lệ thì gắn vào req.user, nếu không thì tiếp tục
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next
 */
function optionalAuth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    }
  }

  next();
}

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin,
  optionalAuth,
};

