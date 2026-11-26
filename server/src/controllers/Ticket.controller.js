const Ticket = require("../models/Ticket");

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

    await ticket.populate("createdBy", "name email" );

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

module.exports = { createTicket };
