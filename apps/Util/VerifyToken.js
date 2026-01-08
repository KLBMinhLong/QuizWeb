var jwt = require("jsonwebtoken");
var config = require(global.__basedir + "/Config/Setting.json");

const JWT_SECRET = process.env.JWT_SECRET || config.auth.jwtSecret;

function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

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

  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role,
    roles: decoded.roles || [decoded.role],
    permissions: decoded.permissions || [],
  };

  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).redirect("/auth/login");
  }

  const hasAdminRole = req.user.roles && req.user.roles.includes("admin");
  if (hasAdminRole || req.user.role === "admin") {
    return next();
  }

  return res.status(403).send("Bạn không có quyền truy cập trang này");
}

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

function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

function hasRole(user, role) {
  if (!user) return false;
  const userRoles = user.roles || [user.role];
  return userRoles.includes(role);
}

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
