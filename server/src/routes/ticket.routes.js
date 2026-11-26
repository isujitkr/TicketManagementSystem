const express = require("express");
const {
  createTicket,
  listTickets,
  getTicketDetails,
  updateOwnTicket,
} = require("../controllers/Ticket.controller");
const {
  isAuthenticated,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants");

const router = express.Router();

router.use(isAuthenticated);

router.post("/", authorizeRoles(ROLES.USER), createTicket);
router.get("/", authorizeRoles(ROLES.USER), listTickets);
router.get("/:id", getTicketDetails);
router.patch("/:id", authorizeRoles(ROLES.USER), updateOwnTicket);

module.exports = router;
