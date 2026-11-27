const { subscribe } = require('./emitter');
const { EVENTS } = require('../constants');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');

const pretty = (value) => String(value).replace(/_/g, ' ');

const describeChanges = (changes = {}) =>
  Object.entries(changes)
    .map(([field, change]) =>
      change.changed ? `${field} edited` : `${field}: ${pretty(change.from)} → ${pretty(change.to)}`
    )
    .join(', ');

const record = (type, { ticket, actor, meta }, message) =>
  ActivityLog.create({
    type,
    ticket: ticket.id,
    ticketTitle: ticket.title,
    actor: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    message,
    metadata: meta || {},
  });

const adminIds = (excludeId) => User.find({ role: 'admin', _id: { $ne: excludeId } }).distinct('_id');

const counterparts = ({ ticket, actor }) =>
  actor.id === ticket.ownerId ? adminIds(actor.id) : [ticket.ownerId];

const notify = async (recipients, type, ticket, message) => {
  const docs = (recipients || [])
    .filter(Boolean)
    .map((recipient) => ({ recipient, type, ticket: ticket ? ticket.id : null, message }));
  if (docs.length) await Notification.insertMany(docs);
};

let registered = false;

const registerListeners = () => {
  if (registered) return;
  registered = true;

  subscribe(EVENTS.TICKET_CREATED, async (p) => {
    await record(EVENTS.TICKET_CREATED, p, `${p.actor.name} created ticket "${p.ticket.title}"`);
    await notify(
      await adminIds(p.actor.id),
      EVENTS.TICKET_CREATED,
      p.ticket,
      `New ticket "${p.ticket.title}" from ${p.actor.name}`
    );
  });

  subscribe(EVENTS.TICKET_UPDATED, async (p) => {
    const summary = describeChanges(p.meta && p.meta.changes);
    await record(
      EVENTS.TICKET_UPDATED,
      p,
      `${p.actor.name} updated ticket "${p.ticket.title}" (${summary})`
    );
    await notify(
      await counterparts(p),
      EVENTS.TICKET_UPDATED,
      p.ticket,
      `${p.actor.name} updated "${p.ticket.title}" (${summary})`
    );
  });

  subscribe(EVENTS.STATUS_CHANGED, async (p) => {
    const { from, to } = p.meta;
    await record(
      EVENTS.STATUS_CHANGED,
      p,
      `${p.actor.name} changed status of "${p.ticket.title}" from ${pretty(from)} to ${pretty(to)}`
    );
    // A resolved ticket gets its own (more specific) notification from TICKET_RESOLVED.
    if (to !== 'resolved' && p.actor.id !== p.ticket.ownerId) {
      await notify(
        [p.ticket.ownerId],
        EVENTS.STATUS_CHANGED,
        p.ticket,
        `Your ticket "${p.ticket.title}" is now ${pretty(to)}`
      );
    }
  });

  subscribe(EVENTS.COMMENT_ADDED, async (p) => {
    await record(EVENTS.COMMENT_ADDED, p, `${p.actor.name} commented on "${p.ticket.title}"`);
    await notify(
      await counterparts(p),
      EVENTS.COMMENT_ADDED,
      p.ticket,
      `${p.actor.name} commented on "${p.ticket.title}"`
    );
  });

  subscribe(EVENTS.TICKET_RESOLVED, async (p) => {
    await record(EVENTS.TICKET_RESOLVED, p, `${p.actor.name} marked "${p.ticket.title}" as resolved`);
    if (p.actor.id !== p.ticket.ownerId) {
      await notify(
        [p.ticket.ownerId],
        EVENTS.TICKET_RESOLVED,
        p.ticket,
        `Your ticket "${p.ticket.title}" has been resolved`
      );
    }
  });

  subscribe(EVENTS.TICKET_DELETED, async (p) => {
    await record(EVENTS.TICKET_DELETED, p, `${p.actor.name} deleted ticket "${p.ticket.title}"`);
    if (p.actor.id !== p.ticket.ownerId) {
      // ticket is gone, so the notification carries no link
      await notify(
        [p.ticket.ownerId],
        EVENTS.TICKET_DELETED,
        null,
        `Your ticket "${p.ticket.title}" was removed by ${p.actor.name}`
      );
    }
  });

  console.log('[events] listeners registered');
};

module.exports = { registerListeners };
