const express = require("express");
const {
  listAllNotifications,
  markAllRead,
  markRead,
} = require("../controllers/notification.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(isAuthenticated);
router.get("/", listAllNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
