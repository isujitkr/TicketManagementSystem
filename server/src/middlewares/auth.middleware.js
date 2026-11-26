const User = require("../models/User");
const { verifyToken } = require("../utils/token");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies["access-token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource",
      });
    }

    next();
  };
};

module.exports = { isAuthenticated, authorizeRoles };
