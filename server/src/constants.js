const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

const TICKET_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const TICKET_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

const TICKET_CATEGORY = {
  TECHNICAL: "technical",
  BILLING: "billing",
  ACCOUNT: "account",
  FEATURE_REQUEST: "feature_request",
  GENERAL: "general",
};

const PRIORITY_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const ROLE_LIST = Object.values(ROLES);
const STATUS_LIST = Object.values(TICKET_STATUS);
const PRIORITY_LIST = Object.values(TICKET_PRIORITY);
const CATEGORY_LIST = Object.values(TICKET_CATEGORY);

module.exports = {
  ROLES,
  ROLE_LIST,
  PRIORITY_LIST,
  PRIORITY_WEIGHT,
  STATUS_LIST,
  CATEGORY_LIST,
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
};
