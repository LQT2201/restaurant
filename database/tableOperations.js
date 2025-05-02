import initDb from "./database";

// Get all tables
export const getAllTables = async () => {
  try {
    const db = await initDb();
    // Also get ongoing order details for each table if available
    const query = `
      SELECT t.*, 
             o.id as active_order_id,
             o.total_amount as active_order_amount,
             o.created_at as order_created_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'pending'
      ORDER BY t.name
    `;
    return await db.getAllAsync(query);
  } catch (error) {
    console.error("Error getting all tables:", error);
    throw error;
  }
};

// Get table by ID
export const getTableById = async (tableId) => {
  try {
    const db = await initDb();
    const query = `
      SELECT t.*, 
             o.id as active_order_id,
             o.total_amount as active_order_amount,
             o.created_at as order_created_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'pending'
      WHERE t.id = ?
    `;
    const table = await db.getFirstAsync(query, [tableId]);

    if (!table) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    return table;
  } catch (error) {
    console.error(`Error getting table ID ${tableId}:`, error);
    throw error;
  }
};

// Add new table
export const addTable = async (tableData) => {
  try {
    console.log(tableData);

    const {
      name = "",
      capacity = 4,
      section = "Main",
      status = "empty",
    } = tableData;

    if (!name) {
      throw new Error("Table name is required");
    }

    const db = await initDb();

    // Check if table with same name already exists
    const existingTable = await db.getFirstAsync(
      "SELECT id FROM tables WHERE name = ?",
      [name]
    );

    if (existingTable) {
      throw new Error(`Table with name "${name}" already exists`);
    }

    const result = await db.runAsync(
      "INSERT INTO tables (name, capacity, section, status) VALUES (?, ?, ?, ?)",
      [name, capacity, section, status]
    );

    return {
      id: result.lastInsertRowId,
      name,
      capacity,
      section,
      status,
    };
  } catch (error) {
    console.error("Error adding table:", error);
    throw error;
  }
};

// Update table
export const updateTable = async (tableId, tableData) => {
  try {
    const db = await initDb();

    // Check if table exists
    const existingTable = await db.getFirstAsync(
      "SELECT * FROM tables WHERE id = ?",
      [tableId]
    );

    if (!existingTable) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    // Build dynamic update query based on provided fields
    const fields = [];
    const values = [];

    if (tableData.name !== undefined) {
      // Check if another table with the same name exists (excluding current table)
      if (tableData.name !== existingTable.name) {
        const nameCheck = await db.getFirstAsync(
          "SELECT id FROM tables WHERE name = ? AND id != ?",
          [tableData.name, tableId]
        );

        if (nameCheck) {
          throw new Error(
            `Another table with name "${tableData.name}" already exists`
          );
        }
      }
      fields.push("name = ?");
      values.push(tableData.name);
    }

    if (tableData.capacity !== undefined) {
      fields.push("capacity = ?");
      values.push(tableData.capacity);
    }

    if (tableData.section !== undefined) {
      fields.push("section = ?");
      values.push(tableData.section);
    }

    if (tableData.status !== undefined) {
      // Validate status
      const validStatuses = ["empty", "occupied", "reserved", "maintenance"];
      if (!validStatuses.includes(tableData.status)) {
        throw new Error(
          `Invalid table status. Must be one of: ${validStatuses.join(", ")}`
        );
      }
      fields.push("status = ?");
      values.push(tableData.status);
    }

    if (fields.length === 0) {
      return existingTable; // Nothing to update
    }

    // Add table ID to values array
    values.push(tableId);

    await db.runAsync(
      `UPDATE tables SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated table
    return await getTableById(tableId);
  } catch (error) {
    console.error(`Error updating table ID ${tableId}:`, error);
    throw error;
  }
};

// Update table status
export const updateTableStatus = async (tableId, status) => {
  try {
    const db = await initDb();

    // Check if table exists
    const existingTable = await db.getFirstAsync(
      "SELECT * FROM tables WHERE id = ?",
      [tableId]
    );

    if (!existingTable) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    // Validate status
    const validStatuses = ["empty", "occupied", "reserved", "maintenance"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid table status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Check if there's an ongoing order
    if (status === "empty") {
      const activeOrder = await db.getFirstAsync(
        "SELECT id FROM orders WHERE table_id = ? AND status = ?",
        [tableId, "pending"]
      );

      if (activeOrder) {
        throw new Error(
          `Cannot mark table as empty because it has an active order (ID: ${activeOrder.id})`
        );
      }
    }

    await db.runAsync("UPDATE tables SET status = ? WHERE id = ?", [
      status,
      tableId,
    ]);

    return { id: tableId, status };
  } catch (error) {
    console.error(`Error updating status for table ID ${tableId}:`, error);
    throw error;
  }
};

// Delete table
export const deleteTable = async (tableId) => {
  try {
    const db = await initDb();

    // Check if table exists
    const existingTable = await db.getFirstAsync(
      "SELECT * FROM tables WHERE id = ?",
      [tableId]
    );

    if (!existingTable) {
      throw new Error(`Table with ID ${tableId} not found`);
    }

    // Check if table has any orders (past or present)
    const orderCheck = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM orders WHERE table_id = ?",
      [tableId]
    );

    if (orderCheck && orderCheck.count > 0) {
      throw new Error(
        `Cannot delete table with ID ${tableId} because it has ${orderCheck.count} associated orders. Consider marking it as 'maintenance' instead.`
      );
    }

    const result = await db.runAsync("DELETE FROM tables WHERE id = ?", [
      tableId,
    ]);

    return {
      success: true,
      message: `Table ID ${tableId} deleted successfully`,
    };
  } catch (error) {
    console.error(`Error deleting table ID ${tableId}:`, error);
    throw error;
  }
};

// Get tables by section
export const getTablesBySection = async (section) => {
  try {
    const db = await initDb();
    const query = `
      SELECT t.*, 
             o.id as active_order_id,
             o.total_amount as active_order_amount,
             o.created_at as order_created_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'pending'
      WHERE t.section = ?
      ORDER BY t.name
    `;
    return await db.getAllAsync(query, [section]);
  } catch (error) {
    console.error(`Error getting tables for section "${section}":`, error);
    throw error;
  }
};

// Get tables by status
export const getTablesByStatus = async (status) => {
  try {
    const db = await initDb();
    const query = `
      SELECT t.*, 
             o.id as active_order_id,
             o.total_amount as active_order_amount,
             o.created_at as order_created_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'pending'
      WHERE t.status = ?
      ORDER BY t.name
    `;
    return await db.getAllAsync(query, [status]);
  } catch (error) {
    console.error(`Error getting tables with status "${status}":`, error);
    throw error;
  }
};

// Get all available table sections
export const getTableSections = async () => {
  try {
    const db = await initDb();
    const sections = await db.getAllAsync(
      "SELECT DISTINCT section FROM tables ORDER BY section"
    );
    return sections.map((s) => s.section);
  } catch (error) {
    console.error("Error getting table sections:", error);
    throw error;
  }
};
