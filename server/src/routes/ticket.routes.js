const express = require("express");
const { createTicket } = require("../controllers/Ticket.controller");
const {
  isAuthenticated,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants");

const router = express.Router();

router.use(isAuthenticated);

router.post("/", authorizeRoles(ROLES.USER), createTicket);

module.exports = router;
