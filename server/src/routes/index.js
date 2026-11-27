const express = require("express");

const router = express.Router();
const authRoutes = require("./auth.routes");
const ticketRoutes = require("./ticket.routes");
const adminRoutes = require("./admin.routes")

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
