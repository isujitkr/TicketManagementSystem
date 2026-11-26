const express = require('express');

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => res.json({ success: true, status: 'ok' }));

module.exports = app;