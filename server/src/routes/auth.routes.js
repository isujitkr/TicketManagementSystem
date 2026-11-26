const express = require("express");
const {
  register,
  login,
  logOut,
  getMe,
} = require("../controllers/auth.controller");
const { authLimiter } = require("../middlewares/rateLimit.middleware");
const { isAuthenticated } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logOut);
router.get("/me", isAuthenticated, getMe);

module.exports = router;
