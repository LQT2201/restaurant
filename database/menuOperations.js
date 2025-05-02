import initDb from "./database";

// Category Operations
export const getAllCategories = async () => {
  try {
    const db = await initDb();
    // Get categories with count of items in each category
    const query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id) as item_count 
      FROM menu_categories c
      ORDER BY c.display_order, c.name
    `;
    return await db.getAllAsync(query);
  } catch (error) {
    console.error("Error getting all categories:", error);
    throw error;
  }
};

export const getCategoryById = async (categoryId) => {
  try {
    const db = await initDb();
    // Get category details
    const category = await db.getFirstAsync(
      "SELECT * FROM menu_categories WHERE id = ?",
      [categoryId]
    );

    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    // Get items in this category
    category.items = await db.getAllAsync(
      "SELECT * FROM menu_items WHERE category_id = ? ORDER BY display_order, name",
      [categoryId]
    );

    return category;
  } catch (error) {
    console.error(`Error getting category ID ${categoryId}:`, error);
    throw error;
  }
};

export const addCategory = async (categoryData) => {
  try {
    const {
      name,
      description = "",
      image_url = "",
      display_order = 100,
    } = categoryData;
    const db = await initDb();

    // Check if category with same name already exists
    const existingCategory = await db.getFirstAsync(
      "SELECT id FROM menu_categories WHERE name = ?",
      [name]
    );

    if (existingCategory) {
      throw new Error(`Category with name "${name}" already exists`);
    }

    const result = await db.runAsync(
      "INSERT INTO menu_categories (name, description, image_url, display_order) VALUES (?, ?, ?, ?)",
      [name, description, image_url, display_order]
    );

    return {
      id: result.lastInsertRowId,
      name,
      description,
      image_url,
      display_order,
    };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const db = await initDb();

    // Check if category exists
    const existingCategory = await db.getFirstAsync(
      "SELECT * FROM menu_categories WHERE id = ?",
      [categoryId]
    );

    if (!existingCategory) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    // Build dynamic update query based on provided fields
    const fields = [];
    const values = [];

    if (categoryData.name !== undefined) {
      // Check if another category with the same name exists (excluding current category)
      if (categoryData.name !== existingCategory.name) {
        const nameCheck = await db.getFirstAsync(
          "SELECT id FROM menu_categories WHERE name = ? AND id != ?",
          [categoryData.name, categoryId]
        );

        if (nameCheck) {
          throw new Error(
            `Another category with name "${categoryData.name}" already exists`
          );
        }
      }
      fields.push("name = ?");
      values.push(categoryData.name);
    }

    if (categoryData.description !== undefined) {
      fields.push("description = ?");
      values.push(categoryData.description);
    }

    if (categoryData.image_url !== undefined) {
      fields.push("image_url = ?");
      values.push(categoryData.image_url);
    }

    if (categoryData.display_order !== undefined) {
      fields.push("display_order = ?");
      values.push(categoryData.display_order);
    }

    if (fields.length === 0) {
      return existingCategory; // Nothing to update
    }

    // Add category ID to values array
    values.push(categoryId);

    await db.runAsync(
      `UPDATE menu_categories SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated category
    return await getCategoryById(categoryId);
  } catch (error) {
    console.error(`Error updating category ID ${categoryId}:`, error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const db = await initDb();

    // Check if any menu items use this category
    const itemCount = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?",
      [categoryId]
    );

    if (itemCount && itemCount.count > 0) {
      throw new Error(
        `Cannot delete category with ID ${categoryId} because it has ${itemCount.count} menu items. Delete or reassign these items first.`
      );
    }

    // Delete the category
    const result = await db.runAsync(
      "DELETE FROM menu_categories WHERE id = ?",
      [categoryId]
    );

    if (result.changes === 0) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    return {
      success: true,
      message: `Category ID ${categoryId} deleted successfully`,
    };
  } catch (error) {
    console.error(`Error deleting category ID ${categoryId}:`, error);
    throw error;
  }
};

// Menu Item Operations
export const getAllMenuItems = async () => {
  try {
    const db = await initDb();
    const query = `
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN menu_categories c ON m.category_id = c.id
      ORDER BY m.display_order, m.name
    `;
    return await db.getAllAsync(query);
  } catch (error) {
    console.error("Error getting all menu items:", error);
    throw error;
  }
};

export const getMenuItemsByCategory = async (categoryId) => {
  try {
    const db = await initDb();
    const query = `
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN menu_categories c ON m.category_id = c.id
      WHERE m.category_id = ?
      ORDER BY m.display_order, m.name
    `;
    return await db.getAllAsync(query, [categoryId]);
  } catch (error) {
    console.error(
      `Error getting menu items for category ${categoryId}:`,
      error
    );
    throw error;
  }
};

export const getMenuItemById = async (itemId) => {
  try {
    const db = await initDb();
    const query = `
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN menu_categories c ON m.category_id = c.id
      WHERE m.id = ?
    `;
    const item = await db.getFirstAsync(query, [itemId]);

    if (!item) {
      throw new Error(`Menu item with ID ${itemId} not found`);
    }

    return item;
  } catch (error) {
    console.error(`Error getting menu item ID ${itemId}:`, error);
    throw error;
  }
};

export const searchMenuItems = async (searchTerm) => {
  try {
    const db = await initDb();
    const query = `
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN menu_categories c ON m.category_id = c.id
      WHERE m.name LIKE ? OR m.description LIKE ?
      ORDER BY m.display_order, m.name
    `;
    const searchPattern = `%${searchTerm}%`;
    return await db.getAllAsync(query, [searchPattern, searchPattern]);
  } catch (error) {
    console.error(`Error searching menu items for "${searchTerm}":`, error);
    throw error;
  }
};

export const addMenuItem = async (itemData) => {
  try {
    const {
      name,
      price,
      description = "",
      image_url = "",
      category_id,
      is_available = 1,
      display_order = 100,
    } = itemData;

    const db = await initDb();

    // Validate required fields
    if (!name || price === undefined || price === null) {
      throw new Error("Name and price are required for menu items");
    }

    // Check if the category exists
    if (category_id) {
      const category = await db.getFirstAsync(
        "SELECT id FROM menu_categories WHERE id = ?",
        [category_id]
      );

      if (!category) {
        throw new Error(`Category with ID ${category_id} not found`);
      }
    }

    // Check if item with same name already exists
    const existingItem = await db.getFirstAsync(
      "SELECT id FROM menu_items WHERE name = ?",
      [name]
    );

    if (existingItem) {
      throw new Error(`Menu item with name "${name}" already exists`);
    }

    const result = await db.runAsync(
      "INSERT INTO menu_items (name, price, description, image_url, category_id, is_available, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        price,
        description,
        image_url,
        category_id,
        is_available,
        display_order,
      ]
    );

    return {
      id: result.lastInsertRowId,
      name,
      price,
      description,
      image_url,
      category_id,
      is_available,
      display_order,
    };
  } catch (error) {
    console.error("Error adding menu item:", error);
    throw error;
  }
};

export const updateMenuItem = async (itemId, itemData) => {
  try {
    const db = await initDb();

    // Check if item exists
    const existingItem = await db.getFirstAsync(
      "SELECT * FROM menu_items WHERE id = ?",
      [itemId]
    );

    if (!existingItem) {
      throw new Error(`Menu item with ID ${itemId} not found`);
    }

    // Build dynamic update query based on provided fields
    const fields = [];
    const values = [];

    if (itemData.name !== undefined) {
      // Check if another item with the same name exists (excluding current item)
      if (itemData.name !== existingItem.name) {
        const nameCheck = await db.getFirstAsync(
          "SELECT id FROM menu_items WHERE name = ? AND id != ?",
          [itemData.name, itemId]
        );

        if (nameCheck) {
          throw new Error(
            `Another menu item with name "${itemData.name}" already exists`
          );
        }
      }
      fields.push("name = ?");
      values.push(itemData.name);
    }

    if (itemData.price !== undefined) {
      fields.push("price = ?");
      values.push(itemData.price);
    }

    if (itemData.description !== undefined) {
      fields.push("description = ?");
      values.push(itemData.description);
    }

    if (itemData.image_url !== undefined) {
      fields.push("image_url = ?");
      values.push(itemData.image_url);
    }

    if (itemData.category_id !== undefined) {
      // Check if the category exists
      if (itemData.category_id) {
        const category = await db.getFirstAsync(
          "SELECT id FROM menu_categories WHERE id = ?",
          [itemData.category_id]
        );

        if (!category) {
          throw new Error(`Category with ID ${itemData.category_id} not found`);
        }
      }
      fields.push("category_id = ?");
      values.push(itemData.category_id);
    }

    if (itemData.is_available !== undefined) {
      fields.push("is_available = ?");
      values.push(itemData.is_available);
    }

    if (itemData.display_order !== undefined) {
      fields.push("display_order = ?");
      values.push(itemData.display_order);
    }

    if (fields.length === 0) {
      return existingItem; // Nothing to update
    }

    // Add item ID to values array
    values.push(itemId);

    await db.runAsync(
      `UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated item
    return await getMenuItemById(itemId);
  } catch (error) {
    console.error(`Error updating menu item ID ${itemId}:`, error);
    throw error;
  }
};

export const updateItemAvailability = async (itemId, isAvailable) => {
  try {
    const db = await initDb();

    // Check if item exists
    const existingItem = await db.getFirstAsync(
      "SELECT * FROM menu_items WHERE id = ?",
      [itemId]
    );

    if (!existingItem) {
      throw new Error(`Menu item with ID ${itemId} not found`);
    }

    await db.runAsync("UPDATE menu_items SET is_available = ? WHERE id = ?", [
      isAvailable ? 1 : 0,
      itemId,
    ]);

    return { id: itemId, is_available: isAvailable ? 1 : 0 };
  } catch (error) {
    console.error(
      `Error updating availability for menu item ID ${itemId}:`,
      error
    );
    throw error;
  }
};

export const deleteMenuItem = async (itemId) => {
  try {
    const db = await initDb();

    // Check if item is used in any orders
    const orderItemCheck = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM order_items WHERE menu_item_id = ?",
      [itemId]
    );

    if (orderItemCheck && orderItemCheck.count > 0) {
      throw new Error(
        `Cannot delete menu item with ID ${itemId} because it is used in ${orderItemCheck.count} orders. Consider making it unavailable instead.`
      );
    }

    // Delete the item
    const result = await db.runAsync("DELETE FROM menu_items WHERE id = ?", [
      itemId,
    ]);

    if (result.changes === 0) {
      throw new Error(`Menu item with ID ${itemId} not found`);
    }

    return {
      success: true,
      message: `Menu item ID ${itemId} deleted successfully`,
    };
  } catch (error) {
    console.error(`Error deleting menu item ID ${itemId}:`, error);
    throw error;
  }
};
