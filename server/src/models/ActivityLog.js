const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // one of EVENTS
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      index: true,
    },
    ticketTitle: { type: String },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String },
    actorRole: { type: String },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ createdAt: -1 });

activityLogSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
