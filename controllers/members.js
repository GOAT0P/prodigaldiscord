const { getAllMembers, addMember, deleteMember } = require("../models/members");

// Fetch all members
const fetchMembers = async (req, res) => {
  try {
    const members = await getAllMembers();
    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching members:", error.message);
    res.status(500).json({ error: "Error fetching members" });
  }
};

// Create a new member
const createMember = async (memberData) => {
  try {
    console.log("Creating member with data:", memberData);
    const newMember = await addMember(memberData);
    console.log("Member created successfully:", newMember);
    return newMember;
  } catch (error) {
    console.error("Error creating member:", error);
    throw new Error(`Failed to create member: ${error.message}`);
  }
};

// Remove a member
const removeMember = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedMember = await deleteMember(id);
    if (!deletedMember) {
      return res.status(404).json({ error: "Member not found" });
    }
    res
      .status(200)
      .json({ message: "Member deleted successfully", member: deletedMember });
  } catch (error) {
    console.error("Error deleting member:", error.message);
    res.status(500).json({ error: "Error deleting member" });
  }
};

// Add update member function
const updateMember = async (id, updates) => {
  try {
    const result = await pool.query(
      `UPDATE members 
       SET batch_code = $1, first_name = $2, last_name = $3, internal_role = $4
       WHERE id = $5 RETURNING *`,
      [updates.batch_code, updates.first_name, updates.last_name, updates.internal_role, id]
    );

    if (result.rows.length === 0) {
      throw new Error("Member not found");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating member:", error);
    throw error;
  }
};

module.exports = {
  fetchMembers,
  createMember,
  removeMember,
  updateMember
};
