require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// Debug log to identify middleware
app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url);
  next();
});

// Import routes
const memberRoutes = require("./routes/members");
const discordRoutes = require("./routes/discord");

// Register routes
app.use("/api/members", (req, res, next) => {
  console.log("Members route accessed");
  next();
}, memberRoutes);

app.use("/api/discord", (req, res, next) => {
  console.log("Discord route accessed");
  next();
}, discordRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
