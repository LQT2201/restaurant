import initDb from "./database";

// Get all staff members
export const getAllStaff = async () => {
  try {
    const db = await initDb();
    // Don't return passwords in the list
    return await db.getAllAsync(
      "SELECT id, name, username, role FROM staff ORDER BY name"
    );
  } catch (error) {
    console.error("Error getting all staff:", error);
    throw error;
  }
};

// Get staff by ID
export const getStaffById = async (staffId) => {
  try {
    const db = await initDb();
    // Don't return password
    const staff = await db.getFirstAsync(
      "SELECT id, name, username, role FROM staff WHERE id = ?",
      [staffId]
    );

    if (!staff) {
      throw new Error(`Staff with ID ${staffId} not found`);
    }

    return staff;
  } catch (error) {
    console.error(`Error getting staff ID ${staffId}:`, error);
    throw error;
  }
};

// Add new staff member
export const addStaff = async (staffData) => {
  try {
    const { name, username, password, role } = staffData;

    if (!name || !username || !password || !role) {
      throw new Error("All fields are required to add a staff member");
    }

    const db = await initDb();

    // Check if username already exists
    const existingStaff = await db.getFirstAsync(
      "SELECT id FROM staff WHERE username = ?",
      [username]
    );

    if (existingStaff) {
      throw new Error(`Username '${username}' is already taken`);
    }

    const result = await db.runAsync(
      "INSERT INTO staff (name, username, password, role) VALUES (?, ?, ?, ?)",
      [name, username, password, role]
    );

    return {
      id: result.lastInsertRowId,
      name,
      username,
      role,
    };
  } catch (error) {
    console.error("Error adding staff:", error);
    throw error;
  }
};

// Update staff member
export const updateStaff = async (staffId, staffData) => {
  try {
    const db = await initDb();

    // Check if staff exists
    const existingStaff = await db.getFirstAsync(
      "SELECT * FROM staff WHERE id = ?",
      [staffId]
    );

    if (!existingStaff) {
      throw new Error(`Staff with ID ${staffId} not found`);
    }

    // Build dynamic update query based on provided fields
    const fields = [];
    const values = [];

    if (staffData.name !== undefined) {
      fields.push("name = ?");
      values.push(staffData.name);
    }

    if (staffData.username !== undefined) {
      // Check if username is already taken by someone else
      if (staffData.username !== existingStaff.username) {
        const usernameCheck = await db.getFirstAsync(
          "SELECT id FROM staff WHERE username = ? AND id != ?",
          [staffData.username, staffId]
        );

        if (usernameCheck) {
          throw new Error(`Username '${staffData.username}' is already taken`);
        }
      }
      fields.push("username = ?");
      values.push(staffData.username);
    }

    if (staffData.password !== undefined) {
      fields.push("password = ?");
      values.push(staffData.password);
    }

    if (staffData.role !== undefined) {
      fields.push("role = ?");
      values.push(staffData.role);
    }

    if (fields.length === 0) {
      return existingStaff; // Nothing to update
    }

    // Add staff ID to values array
    values.push(staffId);

    await db.runAsync(
      `UPDATE staff SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated staff (without password)
    return await getStaffById(staffId);
  } catch (error) {
    console.error(`Error updating staff ID ${staffId}:`, error);
    throw error;
  }
};

// Update staff password
export const updateStaffPassword = async (
  staffId,
  currentPassword,
  newPassword
) => {
  try {
    const db = await initDb();

    // Check if staff exists and current password is correct
    const staff = await db.getFirstAsync(
      "SELECT * FROM staff WHERE id = ? AND password = ?",
      [staffId, currentPassword]
    );

    if (!staff) {
      throw new Error("Current password is incorrect");
    }

    await db.runAsync("UPDATE staff SET password = ? WHERE id = ?", [
      newPassword,
      staffId,
    ]);

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error(`Error updating password for staff ID ${staffId}:`, error);
    throw error;
  }
};

// Delete staff member
export const deleteStaff = async (staffId) => {
  try {
    const db = await initDb();

    // Check if staff exists
    const existingStaff = await db.getFirstAsync(
      "SELECT * FROM staff WHERE id = ?",
      [staffId]
    );

    if (!existingStaff) {
      throw new Error(`Staff with ID ${staffId} not found`);
    }

    // Check if this is the last admin
    if (existingStaff.role === "admin") {
      const adminCount = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM staff WHERE role = 'admin'"
      );

      if (adminCount.count <= 1) {
        throw new Error("Cannot delete the last admin account");
      }
    }

    // Check if staff has any orders
    const orderCheck = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM orders WHERE staff_id = ?",
      [staffId]
    );

    if (orderCheck && orderCheck.count > 0) {
      throw new Error(
        `Cannot delete staff with ID ${staffId} because they have ${orderCheck.count} associated orders`
      );
    }

    const result = await db.runAsync("DELETE FROM staff WHERE id = ?", [
      staffId,
    ]);

    return {
      success: true,
      message: `Staff member ID ${staffId} deleted successfully`,
    };
  } catch (error) {
    console.error(`Error deleting staff ID ${staffId}:`, error);
    throw error;
  }
};

// Authenticate staff
export const authenticateStaff = async (username, password) => {
  try {
    const db = await initDb();
    const staff = await db.getFirstAsync(
      "SELECT id, name, username, role FROM staff WHERE username = ? AND password = ?",
      [username, password]
    );

    if (!staff) {
      return null; // Authentication failed
    }

    return staff; // Return staff info without password
  } catch (error) {
    console.error("Error authenticating staff:", error);
    throw error;
  }
};
