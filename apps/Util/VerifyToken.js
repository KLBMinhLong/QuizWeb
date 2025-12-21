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
    roles: decoded.roles || [decoded.role], // Support multiple roles
    permissions: decoded.permissions || [], // Support permissions
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

  // Kiểm tra role trong token (hỗ trợ multiple roles)
  const hasAdminRole = req.user.roles && req.user.roles.includes("admin");
  if (!hasAdminRole && req.user.role !== "admin") {
    return res.status(403).send("Bạn không có quyền truy cập trang này");
  }

  next();
}

/**
 * Middleware factory để yêu cầu role cụ thể
 * @param {...string} allowedRoles - Các role được phép
 * @returns {function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).redirect("/auth/login");
    }

    const userRoles = req.user.roles || [req.user.role];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).send("Bạn không có quyền truy cập trang này");
    }

    next();
  };
}

/**
 * Middleware factory để yêu cầu permission cụ thể
 * @param {...string} requiredPermissions - Các permission cần thiết
 * @returns {function} Express middleware
 */
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).redirect("/auth/login");
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every((perm) => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).send("Bạn không có quyền thực hiện thao tác này");
    }

    next();
  };
}

/**
 * Helper để kiểm tra user có permission không
 * @param {object} user - req.user object
 * @param {string} permission - Permission cần kiểm tra
 * @returns {boolean}
 */
function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

/**
 * Helper để kiểm tra user có role không
 * @param {object} user - req.user object
 * @param {string} role - Role cần kiểm tra
 * @returns {boolean}
 */
function hasRole(user, role) {
  if (!user) return false;
  const userRoles = user.roles || [user.role];
  return userRoles.includes(role);
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
        roles: decoded.roles || [decoded.role],
        permissions: decoded.permissions || [],
      };
    }
  }

  next();
}

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin,
  requireRole,
  requirePermission,
  hasPermission,
  hasRole,
  optionalAuth,
};

