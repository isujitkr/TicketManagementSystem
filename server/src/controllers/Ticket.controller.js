const { Error } = require("mongoose");
const {
  EVENTS,
  STATUS_LIST,
  PRIORITY_LIST,
  CATEGORY_LIST,
  ROLES,
  TICKET_STATUS,
} = require("../constants");
const { publish } = require("../events/emitter");
const Ticket = require("../models/Ticket");
const buildPagination = require("../utils/helper");
const ActivityLog = require("../models/ActivityLog");

const USER_EDITABLE_FIELDS = ["title", "description", "category", "priority"];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAccessibleTicket = async (ticketId, user) => {
  const ticket = await Ticket.findById(ticketId).populate(
    "createdBy",
    "name email",
  );

  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = ticket.createdBy._id.toString() === user._id.toString();

  if (user.role !== ROLES.ADMIN && !isOwner) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  return ticket;
};

const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and descriptions are required",
      });
    }

    const user = req.user;

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      createdBy: user._id,
    });

    await ticket.populate("createdBy", "name email");

    publish(EVENTS.TICKET_CREATED, {
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
      meta: { category: ticket.category, priority: ticket.priority },
    });

    return res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const listTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
      q,
      status,
      priority,
      category,
      createdBy,
    } = req.query;

    const query = {};

    if (status && !STATUS_LIST.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (priority && !PRIORITY_LIST.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    if (category && !CATEGORY_LIST.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (createdBy) query.createdBy = createdBy;
    if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    query.$or = [{ title: rx }, { description: rx }];
  }

    const sortField = sortBy === "priority" ? "priorityWeight" : sortBy;
    const sort = { [sortField]: order === "asc" ? 1 : -1, _id: -1 };

    if (req.user.role === ROLES.USER) {
      query.createdBy = req.user._id;
    } else if (req.user.role === ROLES.ADMIN) {
      if (createdBy) {
        if (!mongoose.Types.ObjectId.isValid(createdBy)) {
          return res.status(400).json({
            success: false,
            message: "Invalid user ID",
          });
        }

        query.createdBy = createdBy;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const [items, total] = await Promise.all([
      Ticket.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "name email")
        .lean(),
      Ticket.countDocuments(query),
    ]);

    const pagination = buildPagination({ page, limit, total });

    return res.status(200).json({
      success: true,
      data: items,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTicketDetails = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const user = req.user;

    const ticket = await getAccessibleTicket(ticketId, user);

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOwnTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const data = req.body;
    const user = req.user;

    const ticket = await getAccessibleTicket(ticketId, user);

    if (ticket.status !== TICKET_STATUS.OPEN) {
      return res.status(409).json({
        success: false,
        message: "Only tickets that are still open can be edited",
      });
    }

    const changes = {};
    USER_EDITABLE_FIELDS.forEach((field) => {
      if (data[field] !== undefined && data[field] !== ticket[field]) {
        changes[field] =
          field === "description"
            ? { changed: true }
            : { from: ticket[field], to: data[field] };
        ticket[field] = data[field];
      }
    });

    if (!Object.keys(changes).length) {
      return res.status(200).json({
        success: true,
        message: "No changes detected",
        data: ticket,
      });
    }

    await ticket.save();

    publish(EVENTS.TICKET_UPDATED, {
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
      meta: { changes },
    });

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const singleTicketActivity = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const user = req.user;
    
    const ticket = await getAccessibleTicket(ticketId, user);
    
    const activity = await ActivityLog.find({ ticket: ticket._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    })
  }
};

module.exports = {
  createTicket,
  listTickets,
  getTicketDetails,
  updateOwnTicket,
  getAccessibleTicket,
  singleTicketActivity
};
