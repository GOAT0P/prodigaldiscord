const express = require("express");
const router = express.Router();
const { fetchDiscordRoles } = require("../utils/discord");

// Fetch roles from Discord
router.get("/roles", async (req, res) => {
  try {
    const roles = await fetchDiscordRoles();
    res.status(200).json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Error fetching roles" });
  }
});

module.exports = router;
