const express = require("express");
const {
  isAuthenticated,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants");
const {
  getAllUsers,
  updateTicketByAdmin,
  deleteTicket,
  stats,
} = require("../controllers/admin.controller");
const { listTickets } = require("../controllers/Ticket.controller");

const router = express.Router();

router.use(isAuthenticated, authorizeRoles(ROLES.ADMIN));

router.get("/user", getAllUsers);
router.get("/tickets", listTickets);
router.patch("/tickets/:id", updateTicketByAdmin);
router.delete("/tickets/:id", deleteTicket);
router.get("/stats", stats);

module.exports = router;
