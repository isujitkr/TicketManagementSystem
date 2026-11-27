const Notification = require("../models/Notification");
const buildPagination = require("../utils/helper");

const listAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { recipient: req.user._id };

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      unreadCount,
      pagination: buildPagination({ page, limit, total }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: true,
        message: "Notification not found",
      });
    }
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true },
    );
    return res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};

module.exports = { listAllNotifications, markRead, markAllRead };
