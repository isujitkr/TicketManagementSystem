const { default: mongoose } = require("mongoose");
const {
  ROLES,
  EVENTS,
  TICKET_STATUS,
  STATUS_LIST,
  PRIORITY_LIST,
} = require("../constants");
const { publish } = require("../events/emitter");
const Comment = require("../models/Comment");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { getAccessibleTicket } = require("./Ticket.controller");
const buildPagination = require("../utils/helper");
const ActivityLog = require("../models/ActivityLog");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: ROLES.USER })
      .select("name email")
      .sort("name")
      .lean();

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTicketByAdmin = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, priority } = req.body;
    const admin = req.user;

    const ticket = await getAccessibleTicket(ticketId, admin);

    const priorityChanged =
      priority !== undefined && priority !== ticket.priority;

    const statusChanged = status !== undefined && status !== ticket.status;

    if (!priorityChanged && !statusChanged) {
      return res.status(200).json({
        success: true,
        message: "No changes detected",
        data: ticket,
      });
    }

    const previousStatus = ticket.status;
    const priorityChange = priorityChanged
      ? { from: ticket.priority, to: priority }
      : null;

    if (priorityChanged) ticket.priority = priority;
    if (statusChanged) {
      ticket.status = status;
      ticket.resolvedAt = status === TICKET_STATUS.RESOLVED ? new Date() : null;
    }
    await ticket.save();

    const base = {
      ticket: {
        id: ticket._id.toString(),
        title: ticket.title,
        ownerId: ticket.createdBy._id.toString(),
        status: ticket.status,
      },
      actor: {
        id: admin._id.toString(),
        name: admin.name,
        role: admin.role,
      },
    };

    if (priorityChanged) {
      publish(EVENTS.TICKET_UPDATED, {
        ...base,
        meta: { changes: { priority: priorityChange } },
      });
    }
    if (statusChanged) {
      publish(EVENTS.STATUS_CHANGED, {
        ...base,
        meta: { from: previousStatus, to: status },
      });
      if (status === TICKET_STATUS.RESOLVED) {
        publish(EVENTS.TICKET_RESOLVED, {
          ...base,
          meta: { from: previousStatus },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Updates Successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const user = req.user;

    const ticket = await getAccessibleTicket(ticketId, user);

    if (
      user.role !== "admin" &&
      ticket.createdBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this ticket",
      });
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await Comment.deleteMany({ ticket: ticketId }, { session });
      await Ticket.findByIdAndDelete(ticketId, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    publish(EVENTS.TICKET_DELETED, {
      ticket: {
        id: ticket._id.toString(),
        title: ticket.title,
        ownerId: ticket.createdBy._id.toString(),
        status: ticket.status,
      },
      actor: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    });

    return res.status(200).json({
      success: true,
      message: "TIcket deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const stats = async (req, res) => {
  const [byStatus, byPriority, total] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Ticket.countDocuments(),
  ]);

  const toMap = (keys, rows) =>
    keys.reduce((acc, key) => {
      const row = rows.find((r) => r._id === key);
      acc[key] = row ? row.count : 0;
      return acc;
    }, {});

  return res.status(200).json({
    data: {
      total,
      byStatus: toMap(STATUS_LIST, byStatus),
      byPriority: toMap(PRIORITY_LIST, byPriority),
    },
  });
};

const activityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const [items, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  updateTicketByAdmin,
  deleteTicket,
  stats,
  activityFeed,
};
