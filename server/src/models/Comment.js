const mongoose = require("mongoose");
const { ROLE_LIST } = require("../constants");

const commentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorRole: { type: String, enum: ROLE_LIST, required: true },
    message: {
      type: String,
      required: [true, "Comment cannot be empty"],
      trim: true,
      maxlength: [2000, "Comment must be at most 2000 characters"],
    },
  },
  { timestamps: true },
);

commentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Comment", commentSchema);
