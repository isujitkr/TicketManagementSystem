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
const {
  getComments,
  addComment,
} = require("../controllers/comment.controller");
const { deleteTicket } = require("../controllers/admin.controller");

const router = express.Router();

router.use(isAuthenticated);

router.post("/", authorizeRoles(ROLES.USER), createTicket);
router.get("/", authorizeRoles(ROLES.USER), listTickets);
router.get("/:id", getTicketDetails);
router.patch("/:id", authorizeRoles(ROLES.USER), updateOwnTicket);
router.delete("/:id", authorizeRoles(ROLES.USER), deleteTicket);

router.post("/:id/comments", addComment);
router.get("/:id/comments", getComments);

module.exports = router;
