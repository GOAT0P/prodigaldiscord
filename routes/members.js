const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { createMember, fetchMembers, removeMember } = require("../controllers/members");

// POST route to add a new member
router.post("/", async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Debug log for request body
    const {
      batch_code,
      first_name,
      last_name,
      internal_role,
      discord_id,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name) {
      return res.status(400).json({ error: "first_name and last_name are required" });
    }

    // Generate reference code
    const reference_code = uuidv4();
    console.log('Generated reference code:', reference_code);

    // Create member object with all fields
    const memberData = {
      batch_code,
      first_name,
      last_name,
      reference_code,
      internal_role,
      discord_id,
    };

    console.log('Attempting to create member with data:', memberData);
    
    const newMember = await createMember(memberData);
    console.log('Member created successfully:', newMember);
    return res.status(201).json(newMember);
  } catch (error) {
    console.error('Error from createMember:', error);
    return res.status(500).json({ 
      error: "Failed to add member",
      details: error.message 
    });
  }
});

// GET route to fetch all members
router.get("/", async (req, res) => {
  try {
    console.log("Fetching members"); // Debug log for fetching members
    await fetchMembers(req, res);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// DELETE route to remove a member
router.delete("/:id", async (req, res) => {
  try {
    console.log("Accessing DELETE route"); // Debug log for accessing DELETE route
    await removeMember(req, res);
  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).send({ error: "Failed to delete member" });
  }
});

// Add PUT route to update a member
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Add your update logic here
    const result = await pool.query(
      `UPDATE members 
       SET batch_code = $1, first_name = $2, last_name = $3, internal_role = $4
       WHERE id = $5 RETURNING *`,
      [updates.batch_code, updates.first_name, updates.last_name, updates.internal_role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(500).json({ error: "Failed to update member" });
  }
});

module.exports = router;
