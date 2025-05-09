import initDb from "./database";

/**
 * Get all orders with basic details and optional filters
 *
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} - List of orders matching the filters
 */
export const getAllOrders = async (filters = {}) => {
  try {
    const db = await initDb();

    let query = `
      SELECT o.*, 
             t.name as table_name,
             s.name as staff_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.staff_id = s.id
    `;

    const queryParams = [];
    const conditions = [];

    // Apply filters if provided
    if (filters.status) {
      conditions.push("o.status = ?");
      queryParams.push(filters.status);
    }

    if (filters.tableId) {
      conditions.push("o.table_id = ?");
      queryParams.push(filters.tableId);
    }

    if (filters.staffId) {
      conditions.push("o.staff_id = ?");
      queryParams.push(filters.staffId);
    }

    if (filters.dateFrom) {
      conditions.push("o.created_at >= ?");
      queryParams.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push("o.created_at <= ?");
      queryParams.push(filters.dateTo);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Add sorting
    query += ` ORDER BY o.created_at DESC`;

    // Apply limit if provided
    if (filters.limit) {
      query += " LIMIT ?";
      queryParams.push(filters.limit);
    }

    return await db.getAllAsync(query, queryParams);
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
};

// Get order by ID with detailed information
export const getOrderById = async (orderId) => {
  try {
    const db = await initDb();

    // Get order details
    const query = `
      SELECT o.*, 
             t.name as table_name,
             IFNULL(s.name, 'Nhân viên mặc định') as staff_name,
             s.id as staff_id
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.staff_id = s.id
      WHERE o.id = ?
    `;

    const order = await db.getFirstAsync(query, [orderId]);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Get order items
    const itemsQuery = `
      SELECT oi.*,
             mi.name,
             mi.description,
             mi.image_url,
             c.name as category_name
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN menu_categories c ON mi.category_id = c.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;

    order.items = await db.getAllAsync(itemsQuery, [orderId]);

    // Calculate total amount if it's not set
    if (!order.total_amount && order.items.length > 0) {
      order.total_amount = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    return order;
  } catch (error) {
    console.error(`Error getting order ID ${orderId}:`, error);
    throw error;
  }
};

// Create new order
export const createOrder = async (orderData) => {
  try {
    const { table_id, items, notes = "", status = "pending" } = orderData;

    if (!table_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error(
        "Table ID and at least one item are required to create an order"
      );
    }

    const db = await initDb();

    // Calculate initial total and validate items
    let totalAmount = 0;
    const menuItems = new Map();

    // Get all menu items in one query
    const menuItemsResult = await db.getAllAsync(
      "SELECT * FROM menu_items WHERE id IN (?)",
      [items.map((item) => item.menu_item_id).join(",")]
    );

    if (!menuItemsResult || menuItemsResult.length === 0) {
      throw new Error("No valid menu items found");
    }

    menuItemsResult.forEach((item) => menuItems.set(item.id, item));

    // Validate all items before starting transaction
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || item.quantity <= 0) {
        throw new Error(
          "Each order item must have a valid menu_item_id and positive quantity"
        );
      }

      const menuItem = menuItems.get(item.menu_item_id);
      if (!menuItem) {
        throw new Error(`Menu item with ID ${item.menu_item_id} not found`);
      }

      if (menuItem.is_available !== 1) {
        throw new Error(`Menu item "${menuItem.name}" is not available`);
      }

      const price = item.price || menuItem.price;
      totalAmount += price * item.quantity;
    }

    // Check table status
    const table = await db.getFirstAsync("SELECT * FROM tables WHERE id = ?", [
      table_id,
    ]);

    if (!table) {
      throw new Error(`Table with ID ${table_id} not found`);
    }

    if (table.status !== "empty" && table.status !== "reserved") {
      throw new Error(
        `Table "${table.name}" is not available (current status: ${table.status})`
      );
    }

    // Start transaction
    await db.runAsync("BEGIN TRANSACTION");

    try {
      // Create order first and get the ID
      const orderResult = await db.runAsync(
        'INSERT INTO orders (table_id, total_amount, status, notes, created_at) VALUES (?, ?, ?, ?, datetime("now", "localtime"))',
        [table_id, totalAmount, status, notes]
      );

      if (!orderResult) {
        throw new Error("Failed to create order");
      }

      // Get the last inserted order ID
      const lastOrderResult = await db.getFirstAsync(
        "SELECT last_insert_rowid() as id"
      );

      if (!lastOrderResult || !lastOrderResult.id) {
        throw new Error("Failed to get order ID after creation");
      }

      const orderId = lastOrderResult.id;

      // Add order items with the confirmed orderId
      for (const item of items) {
        const menuItem = menuItems.get(item.menu_item_id);
        const price = item.price || menuItem.price;

        await db.runAsync(
          "INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.menu_item_id, item.quantity, price, item.notes || null]
        );
      }

      // Update table status
      await db.runAsync("UPDATE tables SET status = ? WHERE id = ?", [
        "occupied",
        table_id,
      ]);

      // Commit transaction
      await db.runAsync("COMMIT");

      // Return the created order
      return {
        id: orderId,
        table_id,
        total_amount: totalAmount,
        status,
        notes,
        created_at: new Date().toISOString(),
        items: items.map((item) => ({
          ...item,
          order_id: orderId,
        })),
      };
    } catch (error) {
      // Rollback on error
      await db.runAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

// Add items to an existing order
export const addOrderItems = async (orderId, items) => {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("At least one item is required");
    }

    const db = await initDb();

    // Check order and table status
    const order = await db.getFirstAsync(
      "SELECT o.*, t.status as table_status FROM orders o LEFT JOIN tables t ON o.table_id = t.id WHERE o.id = ?",
      [orderId]
    );

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (order.status === "completed" || order.status === "cancelled") {
      throw new Error(`Cannot add items to ${order.status} order`);
    }

    if (order.table_status !== "occupied") {
      throw new Error(
        `Cannot add items - table is not occupied (status: ${order.table_status})`
      );
    }

    // Get all menu items in one query
    const menuItems = new Map();
    const menuItemsResult = await db.getAllAsync(
      "SELECT * FROM menu_items WHERE id IN (?)",
      [items.map((item) => item.menu_item_id).join(",")]
    );

    menuItemsResult.forEach((item) => menuItems.set(item.id, item));

    // Validate all items before starting transaction
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || item.quantity <= 0) {
        throw new Error(
          "Each order item must have a valid menu_item_id and positive quantity"
        );
      }

      const menuItem = menuItems.get(item.menu_item_id);
      if (!menuItem) {
        throw new Error(`Menu item with ID ${item.menu_item_id} not found`);
      }

      if (menuItem.is_available !== 1) {
        throw new Error(`Menu item "${menuItem.name}" is not available`);
      }
    }

    // Start transaction
    await db.runAsync("BEGIN TRANSACTION");

    try {
      let additionalAmount = 0;
      let itemsAdded = 0;

      // Add or update items
      for (const item of items) {
        const menuItem = menuItems.get(item.menu_item_id);
        const price = menuItem.price;
        additionalAmount += price * item.quantity;

        // Check for existing item
        const existingItem = await db.getFirstAsync(
          "SELECT * FROM order_items WHERE order_id = ? AND menu_item_id = ?",
          [orderId, item.menu_item_id]
        );

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + item.quantity;
          await db.runAsync(
            "UPDATE order_items SET quantity = ? WHERE id = ?",
            [newQuantity, existingItem.id]
          );
          itemsAdded++;
        } else {
          // Insert new item
          await db.runAsync(
            "INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)",
            [
              orderId,
              item.menu_item_id,
              item.quantity,
              price,
              item.notes || null,
            ]
          );
          itemsAdded++;
        }
      }

      // Update order total
      const newTotal = order.total_amount + additionalAmount;
      await db.runAsync(
        'UPDATE orders SET total_amount = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
        [newTotal, orderId]
      );

      // Commit transaction
      await db.runAsync("COMMIT");

      return {
        order_id: orderId,
        items_added: itemsAdded,
        additional_amount: additionalAmount,
        new_total: newTotal,
      };
    } catch (error) {
      // Rollback on error
      await db.runAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error(`Error adding items to order ID ${orderId}:`, error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, staffId = null) => {
  try {
    const db = await initDb();

    // Check if order exists
    const order = await db.getFirstAsync("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Validate status transition
    const validStatuses = [
      "pending",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid order status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Build update query
    const updateFields = [
      "status = ?",
      'updated_at = datetime("now", "localtime")',
    ];
    const updateValues = [status];

    // Set completion time if order is being completed
    if (status === "completed" && order.status !== "completed") {
      updateFields.push('completed_at = datetime("now", "localtime")');
    }

    // Update staff ID if provided
    if (staffId) {
      // Verify staff exists
      const staff = await db.getFirstAsync(
        "SELECT id FROM staff WHERE id = ?",
        [staffId]
      );

      if (!staff) {
        throw new Error(`Staff with ID ${staffId} not found`);
      }

      updateFields.push("staff_id = ?");
      updateValues.push(staffId);
    }

    // Add order ID to values
    updateValues.push(orderId);

    // Start transaction
    await db.runAsync("BEGIN TRANSACTION");

    try {
      // Update order
      await db.runAsync(
        `UPDATE orders SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      // If completing or cancelling order, update table status
      if (
        (status === "completed" || status === "cancelled") &&
        order.status !== "completed" &&
        order.status !== "cancelled"
      ) {
        await db.runAsync("UPDATE tables SET status = ? WHERE id = ?", [
          "empty",
          order.table_id,
        ]);
      }

      // Commit transaction
      await db.runAsync("COMMIT");

      return {
        id: orderId,
        status,
        message: `Order status updated to '${status}'`,
      };
    } catch (error) {
      // Rollback on error
      await db.runAsync("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error(`Error updating status for order ID ${orderId}:`, error);
    throw error;
  }
};

// Update order items (quantity, remove items)
export const updateOrderItems = async (orderId, items) => {
  try {
    const db = await initDb();

    // Check if order exists and is still pending
    const order = await db.getFirstAsync("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (order.status !== "pending") {
      throw new Error(
        `Cannot update items for order in '${order.status}' status`
      );
    }

    return await db.withTransactionAsync(async (tx) => {
      let totalAmount = 0;

      // For each item in the update
      for (const item of items) {
        // If quantity is 0 or negative, remove the item
        if (item.quantity <= 0) {
          await tx.executeAsync(
            "DELETE FROM order_items WHERE order_id = ? AND id = ?",
            [orderId, item.id]
          );
        } else {
          // Update the quantity
          await tx.executeAsync(
            "UPDATE order_items SET quantity = ?, notes = ? WHERE id = ? AND order_id = ?",
            [item.quantity, item.notes || null, item.id, orderId]
          );
        }
      }

      // Recalculate total
      const updatedItemsResult = await tx.executeAsync(
        "SELECT menu_item_id, quantity, price FROM order_items WHERE order_id = ?",
        [orderId]
      );

      const updatedItems = updatedItemsResult.rows || [];

      if (updatedItems.length > 0) {
        for (const item of updatedItems) {
          totalAmount += item.price * item.quantity;
        }
      } else {
        // If no items left, consider cancelling the order
        await tx.executeAsync(
          'UPDATE orders SET status = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
          ["cancelled", orderId]
        );

        // Update table status
        await tx.executeAsync("UPDATE tables SET status = ? WHERE id = ?", [
          "empty",
          order.table_id,
        ]);

        return {
          order_id: orderId,
          status: "cancelled",
          message: "Order cancelled as all items were removed",
        };
      }

      // Update order total
      await tx.executeAsync(
        'UPDATE orders SET total_amount = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
        [totalAmount, orderId]
      );

      return {
        order_id: orderId,
        total_amount: totalAmount,
        item_count: updatedItems.length,
        message: "Order items updated successfully",
      };
    });
  } catch (error) {
    console.error(`Error updating items for order ID ${orderId}:`, error);
    throw error;
  }
};

/**
 * Cancel an order and optionally provide a reason
 *
 * @param {number} orderId - The ID of the order to cancel
 * @param {string} cancelReason - Optional reason for cancellation
 * @returns {Promise<Object>} - Result of the cancellation operation
 */
export const cancelOrder = async (orderId, cancelReason = "") => {
  try {
    const db = await initDb();

    // Check if order exists
    const order = await db.getFirstAsync("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Only allow cancellation of orders that aren't already completed or cancelled
    if (order.status === "completed" || order.status === "cancelled") {
      throw new Error(`Cannot cancel order in '${order.status}' status`);
    }

    return await db.withTransactionAsync(async (tx) => {
      // Update order status to cancelled
      await tx.executeAsync(
        'UPDATE orders SET status = ?, notes = CASE WHEN notes IS NULL OR notes = "" THEN ? ELSE notes || "\n" || ? END, updated_at = datetime("now", "localtime") WHERE id = ?',
        [
          "cancelled",
          cancelReason,
          `Cancellation reason: ${cancelReason}`,
          orderId,
        ]
      );

      // Update table status
      await tx.executeAsync("UPDATE tables SET status = ? WHERE id = ?", [
        "empty",
        order.table_id,
      ]);

      return {
        id: orderId,
        status: "cancelled",
        message: `Order cancelled successfully${
          cancelReason ? ": " + cancelReason : ""
        }`,
      };
    });
  } catch (error) {
    console.error(`Error cancelling order ID ${orderId}:`, error);
    throw error;
  }
};

// Delete order (should only be used for pending orders with admin access)
export const deleteOrder = async (orderId) => {
  try {
    const db = await initDb();

    // Check if order exists
    const order = await db.getFirstAsync("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Only allow deletion of pending or cancelled orders
    if (order.status !== "pending" && order.status !== "cancelled") {
      throw new Error(
        `Cannot delete order in '${order.status}' status. Only pending or cancelled orders can be deleted.`
      );
    }

    return await db.withTransactionAsync(async (tx) => {
      // Delete order items first
      await tx.executeAsync("DELETE FROM order_items WHERE order_id = ?", [
        orderId,
      ]);

      // Delete the order
      await tx.executeAsync("DELETE FROM orders WHERE id = ?", [orderId]);

      // Update table status if it was occupied by this order
      if (order.status === "pending") {
        await tx.executeAsync("UPDATE tables SET status = ? WHERE id = ?", [
          "empty",
          order.table_id,
        ]);
      }

      return {
        id: orderId,
        success: true,
        message: `Order ID ${orderId} deleted successfully`,
      };
    });
  } catch (error) {
    console.error(`Error deleting order ID ${orderId}:`, error);
    throw error;
  }
};

// Get order items
export const getOrderItems = async (orderId) => {
  try {
    const db = await initDb();

    const query = `
      SELECT oi.*,
             mi.name as item_name,
             mi.description as item_description,
             c.name as category_name
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN menu_categories c ON mi.category_id = c.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;

    return await db.getAllAsync(query, [orderId]);
  } catch (error) {
    console.error(`Error getting items for order ID ${orderId}:`, error);
    throw error;
  }
};

// Get orders by table
export const getOrdersByTable = async (tableId, includeCompleted = false) => {
  try {
    const db = await initDb();

    let query = `
      SELECT o.*, 
             t.name as table_name,
             s.name as staff_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.staff_id = s.id
      WHERE o.table_id = ?
    `;

    const queryParams = [tableId];

    if (!includeCompleted) {
      query += " AND o.status != ? AND o.status != ?";
      queryParams.push("completed", "cancelled");
    }

    query += " ORDER BY o.created_at DESC";

    return await db.getAllAsync(query, queryParams);
  } catch (error) {
    console.error(`Error getting orders for table ID ${tableId}:`, error);
    throw error;
  }
};

// Get orders by staff
export const getOrdersByStaff = async (
  staffId,
  dateFrom = null,
  dateTo = null
) => {
  try {
    const db = await initDb();

    let query = `
      SELECT o.*, 
             t.name as table_name,
             s.name as staff_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.staff_id = s.id
      WHERE o.staff_id = ?
    `;

    const queryParams = [staffId];

    if (dateFrom) {
      query += " AND o.created_at >= ?";
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      query += " AND o.created_at <= ?";
      queryParams.push(dateTo);
    }

    query += " ORDER BY o.created_at DESC";

    return await db.getAllAsync(query, queryParams);
  } catch (error) {
    console.error(`Error getting orders for staff ID ${staffId}:`, error);
    throw error;
  }
};

/**
 * Get all active orders (pending, preparing, ready)
 *
 * @param {number} limit - Optional limit for number of orders to return
 * @returns {Promise<Array>} - List of active orders
 */
export const getActiveOrders = async (limit = null) => {
  try {
    const db = await initDb();

    let query = `
      SELECT o.*, 
             t.name as table_name,
             s.name as staff_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.staff_id = s.id
      WHERE o.status IN ('pending', 'preparing', 'ready')
      ORDER BY 
        CASE o.status
          WHEN 'ready' THEN 1
          WHEN 'preparing' THEN 2
          WHEN 'pending' THEN 3
          ELSE 4
        END,
        o.created_at ASC
    `;

    const params = [];
    if (limit) {
      query += " LIMIT ?";
      params.push(limit);
    }

    const orders = await db.getAllAsync(query, params);

    // For each order, get the items
    for (const order of orders) {
      const items = await getOrderItems(order.id);
      order.items = items;
    }

    return orders;
  } catch (error) {
    console.error("Error getting active orders:", error);
    throw error;
  }
};

/**
 * Get sales report data for a date range
 *
 * @param {string} dateFrom - Start date in ISO format
 * @param {string} dateTo - End date in ISO format
 * @param {string} groupBy - Group by option: 'day', 'week', 'month' (default: 'day')
 * @returns {Promise<Object>} - Sales report data
 */
export const getSalesReport = async (dateFrom, dateTo, groupBy = "day") => {
  try {
    if (!dateFrom || !dateTo) {
      throw new Error("Date range is required for sales report");
    }

    const db = await initDb();

    // Build the date grouping expression based on groupBy parameter
    let dateGroupExpr;
    switch (groupBy.toLowerCase()) {
      case "week":
        dateGroupExpr = "strftime('%Y-%W', o.created_at)";
        break;
      case "month":
        dateGroupExpr = "strftime('%Y-%m', o.created_at)";
        break;
      case "day":
      default:
        dateGroupExpr = "date(o.created_at)";
        break;
    }

    // Get sales summary by date
    const salesByDateQuery = `
      SELECT 
        ${dateGroupExpr} as date_group,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_sales,
        AVG(o.total_amount) as average_order_value
      FROM orders o
      WHERE o.status = 'completed'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY date_group
      ORDER BY date_group
    `;

    const salesByDate = await db.getAllAsync(salesByDateQuery, [
      dateFrom,
      dateTo,
    ]);

    // Get sales by category
    const salesByCategoryQuery = `
      SELECT 
        c.name as category_name,
        SUM(oi.quantity * oi.price) as total_sales,
        SUM(oi.quantity) as items_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN menu_categories c ON mi.category_id = c.id
      WHERE o.status = 'completed'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY c.id
      ORDER BY total_sales DESC
    `;

    const salesByCategory = await db.getAllAsync(salesByCategoryQuery, [
      dateFrom,
      dateTo,
    ]);

    // Get top selling items
    const topItemsQuery = `
      SELECT 
        mi.name as item_name,
        c.name as category_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN menu_categories c ON mi.category_id = c.id
      WHERE o.status = 'completed'
        AND o.created_at >= ?
        AND o.created_at <= ?
      GROUP BY mi.id
      ORDER BY quantity_sold DESC
      LIMIT 10
    `;

    const topSellingItems = await db.getAllAsync(topItemsQuery, [
      dateFrom,
      dateTo,
    ]);

    // Get overall summary
    const summaryQuery = `
      SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order_value,
        (SELECT COUNT(DISTINCT table_id) FROM orders WHERE status = 'completed' AND created_at >= ? AND created_at <= ?) as tables_served
      FROM orders o
      WHERE o.status = 'completed'
        AND o.created_at >= ?
        AND o.created_at <= ?
    `;

    const summary = await db.getFirstAsync(summaryQuery, [
      dateFrom,
      dateTo,
      dateFrom,
      dateTo,
    ]);

    return {
      dateRange: {
        from: dateFrom,
        to: dateTo,
        groupBy,
      },
      summary,
      salesByDate,
      salesByCategory,
      topSellingItems,
    };
  } catch (error) {
    console.error("Error generating sales report:", error);
    throw error;
  }
};

/**
 * Get completed orders within a date range
 *
 * @param {string} dateFrom - Start date in ISO format (optional)
 * @param {string} dateTo - End date in ISO format (optional)
 * @param {number} limit - Maximum number of orders to return (optional)
 * @returns {Promise<Array>} - List of completed orders
 */
export const getCompletedOrders = async (
  dateFrom = null,
  dateTo = null,
  limit = null
) => {
  try {
    const db = await initDb();

    let query = `
      SELECT o.*, 
             t.name as table_name,
             s.name as staff_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN staff s ON o.staff_id = s.id
      WHERE o.status = 'completed'
    `;

    const params = [];

    if (dateFrom) {
      query += " AND o.created_at >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      query += " AND o.created_at <= ?";
      params.push(dateTo);
    }

    query += " ORDER BY o.completed_at DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(limit);
    }

    const orders = await db.getAllAsync(query, params);

    // For each order, get the items
    for (const order of orders) {
      const items = await getOrderItems(order.id);
      order.items = items;
    }

    return orders;
  } catch (error) {
    console.error("Error getting completed orders:", error);
    throw error;
  }
};
