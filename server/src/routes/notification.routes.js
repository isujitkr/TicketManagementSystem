const express = require('express');
const { listAllNotifications } = require('../controllers/notification.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(isAuthenticated);
router.get("/", listAllNotifications)

module.exports = router;