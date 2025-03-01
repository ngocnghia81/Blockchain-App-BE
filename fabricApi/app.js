const express = require("express");
const app = express();
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
// const identityRoutes = require("./routes/identityRoutes");

app.use(express.json());

app.use("/api/v1/auth", authRoutes);
// app.use("/api", identityRoutes);

module.exports = app;
