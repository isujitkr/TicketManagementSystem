const { ROLES, TICKET_STATUS, EVENTS } = require("../constants");
const { publish } = require("../events/emitter");
const Comment = require("../models/Comment");
const { getAccessibleTicket } = require("./Ticket.controller");

const addComment = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const message = req.body.message;
    const user = req.user;
    const ticket = await getAccessibleTicket(ticketId, user);

    if (user.role !== ROLES.ADMIN && ticket.status === TICKET_STATUS.CLOSED) {
      return res.status(409).json({
        success: true,
        message: "This ticket is closed and no longer accepts comments",
      });
    }

    const comment = await Comment.create({
      ticket: ticket._id,
      author: user._id,
      authorRole: user.role,
      message,
    });

    await comment.populate("author", "name role");

    publish(EVENTS.COMMENT_ADDED, {
      ticket: {
        id: ticket.id,
        title: ticket.title,
        ownerId: user._id.toString(),
        status: ticket.status,
      },
      actor: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
      meta: {
        commentId: comment._id.toString(),
        preview: message.slice(0, 80),
      },
    });

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: error.message,
    });
  }
};

const getComments = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const user = req.user;

    const ticket = await getAccessibleTicket(ticketId, user);

    const comments = await Comment.find({ ticket: ticket.id })
      .sort({ createdAt: 1 })
      .populate("author", "name role")
      .lean();

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    return re.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { addComment, getComments };
