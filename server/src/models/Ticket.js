const mongoose = require('mongoose');
const {
  STATUS_LIST,
  PRIORITY_LIST,
  CATEGORY_LIST,
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  PRIORITY_WEIGHT,
} = require('../constants');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description must be at most 5000 characters'],
    },
    category: { type: String, enum: CATEGORY_LIST, default: TICKET_CATEGORY.GENERAL },
    priority: { type: String, enum: PRIORITY_LIST, default: TICKET_PRIORITY.MEDIUM },
    
    priorityWeight: { type: Number, default: PRIORITY_WEIGHT.medium },
    status: { type: String, enum: STATUS_LIST, default: TICKET_STATUS.OPEN },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.pre('save', function syncPriorityWeight() {
  if (this.isNew || this.isModified('priority')) {
    this.priorityWeight = PRIORITY_WEIGHT[this.priority];
  }
});

ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdAt: -1 });

ticketSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.priorityWeight;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Ticket', ticketSchema);
