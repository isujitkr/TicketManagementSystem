const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const signToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "3d" });
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 3 * 24 * 60 * 60 * 1000,
};

const attachCookie = (res, user) => {
  res.cookie("access-token", signToken(user), cookieOptions);
};

const clearCookie = (res) => {
  res.clearCookie("access-token", cookieOptions);
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { signToken, attachCookie, clearCookie, verifyToken };
