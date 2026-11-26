const { EventEmitter } = require("events");

const emitter = new EventEmitter();

const subscribe = (eventName, handler) => {
  emitter.on(eventName, async (payload) => {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`[events] handler for "${eventName}" failed:`, err.message);
    }
  });
};

const publish = (eventName, payload) => {
  emitter.emit(eventName, { ...payload, occurredAt: new Date() });
};

module.exports = { subscribe, publish };
