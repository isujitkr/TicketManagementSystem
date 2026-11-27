const express = require("express");

const router = express.Router();
const authRoutes = require("./auth.routes");
const ticketRoutes = require("./ticket.routes");
const adminRoutes = require("./admin.routes");
const notificationRoutes = require("./notification.routes")

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/admin", adminRoutes);
router.use("/notification", notificationRoutes)

module.exports = router;
