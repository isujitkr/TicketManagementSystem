const express = require("express");

const router = express.Router();
const authRoutes = require("./auth.routes");
const { apiLimiter } = require("../middlewares/rateLimit.middleware");

router.use("/auth", apiLimiter, authRoutes);

module.exports = router;
