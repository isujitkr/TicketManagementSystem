const express = require("express");
const routes = require("./routes/index");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const { apiLimiter } = require("../src/middlewares/rateLimit.middleware");

const app = express();
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true })); 

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/api", apiLimiter, routes);

module.exports = app;
