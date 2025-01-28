const pool = require("../config/db");

// Fetch all members
const getAllMembers = async () => {
  try {
    const result = await pool.query("SELECT * FROM members");
    return result.rows;
  } catch (error) {
    console.error("Error fetching members:", error);
    throw new Error("Database query failed");
  }
};

// Log the schema of the members table
const logSchema = async () => {
  try {
    const schemaResult = await pool.query(
      `SELECT column_name, data_type, character_maximum_length
       FROM information_schema.columns
       WHERE table_name = 'members'`
    );
    console.log("Database schema:", schemaResult.rows);
  } catch (schemaError) {
    console.error("Error fetching database schema:", schemaError);
  }
};

// Add a new member
const addMember = async (member) => {
  const {
    batch_code,
    first_name,
    last_name,
    reference_code,
    internal_role,
    discord_id,
  } = member;

  // Validate input data based on database constraints
  const requiredFields = {
    batch_code,
    first_name,
    last_name,
    reference_code,
    internal_role,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Debug log to check field lengths
  console.log("Field lengths:", {
    batch_code: batch_code.length,
    first_name: first_name.length,
    last_name: last_name.length,
    reference_code: reference_code.length,
    internal_role: internal_role.length,
    discord_id: discord_id ? discord_id.length : 0,
  });

  // Ensure field lengths are within the allowed limits
  const maxLengths = {
    batch_code: 32,
    first_name: 32,
    last_name: 32,
    internal_role: 64,
    discord_id: 64,
  };

  const tooLongFields = Object.entries(maxLengths)
    .filter(([field, maxLength]) => member[field] && member[field].length > maxLength)
    .map(([field]) => field);

  if (tooLongFields.length > 0) {
    throw new Error(`Fields too long: ${tooLongFields.join(', ')}`);
  }

  // Log the schema before inserting
  await logSchema();

  try {
    console.log("Executing query with values:", {
      batch_code,
      first_name,
      last_name,
      reference_code,
      internal_role,
      discord_id,
    });

    const result = await pool.query(
      `INSERT INTO members (batch_code, first_name, last_name, reference_code, internal_role, discord_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        batch_code,
        first_name,
        last_name,
        reference_code,
        internal_role,
        discord_id,
      ]
    );

    if (!result.rows[0]) {
      throw new Error("Insert succeeded but no data was returned");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Database error details:", error);
    if (error.code === '23505') {
      throw new Error("A member with this reference code already exists");
    }
    throw new Error(`Database insert failed: ${error.message}`);
  }
};

// Check if reference code is valid and unused
const checkReferenceCode = async (referenceCode) => {
  try {
    const result = await pool.query(
      "SELECT discord_id FROM members WHERE reference_code = $1",
      [referenceCode]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: "Invalid reference code" };
    }

    if (result.rows[0].discord_id) {
      return { valid: false, message: "Reference code has already been used" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error checking reference code:", error);
    throw new Error("Failed to check reference code");
  }
};

// Remove a member
const deleteMember = async (id) => {
  try {
    const result = await pool.query(
      "DELETE FROM members WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting member:", error);
    throw new Error("Database delete failed");
  }
};

// Get unique batch codes
const getUniqueBatchCodes = async () => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT batch_code FROM members ORDER BY batch_code"
    );
    return result.rows.map(row => row.batch_code);
  } catch (error) {
    console.error("Error fetching batch codes:", error);
    throw error;
  }
};

// Get members by batch code
const getMembersByBatch = async (batchCode) => {
  try {
    const result = await pool.query(
      "SELECT * FROM members WHERE batch_code = $1",
      [batchCode]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching members by batch:", error);
    throw error;
  }
};

// Get recently added members
const getRecentMembers = async () => {
  try {
    const result = await pool.query(
      "SELECT * FROM members ORDER BY created_at DESC LIMIT 5"
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching recent members:", error);
    throw error;
  }
};

// Update member
const updateMember = async (id, updates) => {
  try {
    // Validate required fields
    const requiredFields = ['batch_code', 'first_name', 'last_name', 'internal_role'];
    const missingFields = requiredFields.filter(field => !updates[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate field lengths
    const maxLengths = {
      batch_code: 32,
      first_name: 32,
      last_name: 32,
      internal_role: 64
    };

    const tooLongFields = Object.entries(maxLengths)
      .filter(([field, maxLength]) => updates[field] && updates[field].length > maxLength)
      .map(([field]) => field);

    if (tooLongFields.length > 0) {
      throw new Error(`Fields exceed maximum length: ${tooLongFields.join(', ')}`);
    }

    // Log update attempt
    console.log('Attempting to update member:', { id, updates });

    const result = await pool.query(
      `UPDATE members 
       SET batch_code = $1, first_name = $2, last_name = $3, internal_role = $4
       WHERE id = $5 RETURNING *`,
      [updates.batch_code, updates.first_name, updates.last_name, updates.internal_role, id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Member with id ${id} not found`);
    }

    console.log('Member updated successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating member:", {
      error: error.message,
      stack: error.stack,
      id,
      updates
    });
    throw error;
  }
};

module.exports = {
  getAllMembers,
  addMember,
  deleteMember,
  checkReferenceCode,
  getUniqueBatchCodes,
  getMembersByBatch,
  getRecentMembers,
  updateMember
};
