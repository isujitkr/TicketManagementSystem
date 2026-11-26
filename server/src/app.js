const express = require('express');
const routes = require('./routes/index')

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api', routes);

module.exports = app;