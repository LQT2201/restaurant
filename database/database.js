import * as SQLite from "expo-sqlite";

// Global database object - use initDb() to access
let db = null;

// Initialize and cache the database connection
export const initDb = async () => {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync("restaurant.db");
      // Enable WAL mode for better performance
      await db.execAsync("PRAGMA journal_mode = WAL;");
      console.log("Database initialized:", db);
    } catch (error) {
      console.error("Lỗi khởi tạo cơ sở dữ liệu:", error);
      throw error;
    }
  }
  return db;
};

// Function to drop all tables
export const dropAllTables = async (database) => {
  try {
    await database.execAsync(`
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS menu_items;
      DROP TABLE IF EXISTS menu_categories;
      DROP TABLE IF EXISTS tables;
      DROP TABLE IF EXISTS staff;
    `);
    console.log("Đã xóa tất cả bảng trong cơ sở dữ liệu");
  } catch (error) {
    console.error("Lỗi khi xóa bảng:", error);
    throw error;
  }
};

// Function to drop entire database
export const dropDatabase = async () => {
  try {
    const database = await initDb();
    if (!database) {
      throw new Error("Không thể kết nối đến cơ sở dữ liệu");
    }

    // Drop all tables first
    await dropAllTables(database);

    // Close the database connection
    await database.closeAsync();

    // Delete the database file
    await SQLite.deleteDatabaseAsync("restaurant.db");

    // Reset the global database object
    db = null;

    console.log("Đã xóa toàn bộ cơ sở dữ liệu thành công");
  } catch (error) {
    console.error("Lỗi khi xóa cơ sở dữ liệu:", error);
    throw error;
  }
};

// Initialize database schema and sample data
export const initDatabase = async () => {
  try {
    const database = await initDb();
    if (!database) {
      throw new Error("Database not initialized");
    }

    // Create all tables in one transaction
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 100,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER DEFAULT 4,
        section TEXT DEFAULT 'Main',
        status TEXT NOT NULL DEFAULT 'empty'
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 100,
        FOREIGN KEY (category_id) REFERENCES menu_categories (id)
      );

      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER NOT NULL,
        staff_id INTEGER,
        total_amount REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (table_id) REFERENCES tables (id),
        FOREIGN KEY (staff_id) REFERENCES staff (id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        notes TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
      );
    `);

    // Insert sample data if tables are empty
    await insertSampleData(database);

    console.log("Database tables created successfully");
    return database;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

// Insert sample data into tables if they're empty
async function insertSampleData(database) {
  try {
    // Create admin account if staff table is empty
    const userCount = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM staff"
    );
    if (!userCount || userCount.count === 0) {
      await database.runAsync(
        "INSERT INTO staff (name, username, password, role) VALUES (?, ?, ?, ?)",
        ["Admin", "admin", "admin", "admin"]
      );
      console.log("Created default admin account: admin/admin");
    }

    // Add sample categories if menu_categories table is empty
    const categoryCount = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM menu_categories"
    );
    if (!categoryCount || categoryCount.count === 0) {
      await database.runAsync(
        "INSERT INTO menu_categories (name, description, image_url) VALUES (?, ?, ?)",
        [
          "Món chính",
          "Các món ăn chính truyền thống Việt Nam",
          "https://cdn.tgdd.vn/Files/2022/01/25/1412805/tong-hop-30-mon-an-sang-truyen-thong-cua-viet-nam-202201250313281452.jpg",
        ]
      );
      await database.runAsync(
        "INSERT INTO menu_categories (name, description, image_url) VALUES (?, ?, ?)",
        [
          "Món phụ",
          "Các món ăn phụ và khai vị",
          "https://cdn.tgdd.vn/2021/09/CookRecipe/Avatar/rau-cu-xao-thumbnail.jpg",
        ]
      );
      await database.runAsync(
        "INSERT INTO menu_categories (name, description, image_url) VALUES (?, ?, ?)",
        [
          "Đồ uống",
          "Các loại đồ uống giải khát",
          "https://cdn.tgdd.vn/Files/2021/08/10/1374160/cach-pha-tra-dao-cam-sa-thom-ngon-khong-bi-dang-202108100039248473.jpg",
        ]
      );
    }

    // Add sample menu items if menu_items table is empty
    const menuCount = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM menu_items"
    );
    if (!menuCount || menuCount.count === 0) {
      // Get category IDs
      const mainDishCategory = await database.getFirstAsync(
        "SELECT id FROM menu_categories WHERE name = ?",
        ["Món chính"]
      );
      const sideDishCategory = await database.getFirstAsync(
        "SELECT id FROM menu_categories WHERE name = ?",
        ["Món phụ"]
      );
      const beverageCategory = await database.getFirstAsync(
        "SELECT id FROM menu_categories WHERE name = ?",
        ["Đồ uống"]
      );

      // Insert main dishes
      const mainDishes = [
        {
          name: "Phở Bò",
          price: 40000,
          description:
            "Phở bò truyền thống Việt Nam với nước dùng ninh từ xương bò trong nhiều giờ, hòa quyện cùng hương thơm của quế, hồi, gừng nướng và hành. Tô phở nóng hổi với những lát thịt bò mềm mại, bánh phở trắng ngần và rau thơm tươi mát tạo nên hương vị đậm đà khó quên.",
          image_url:
            "https://fohlafood.vn/cdn/shop/articles/bi-quyet-nau-phi-bo-ngon-tuyet-dinh.jpg?v=1712213789",
        },
        {
          name: "Bún Chả",
          price: 35000,
          description:
            "Bún chả Hà Nội là sự kết hợp hoàn hảo giữa thịt ba chỉ và chả viên được nướng trên than hoa thơm lừng, ăn kèm với bún tươi, rau sống và nước mắm pha chua ngọt. Món ăn mang đến hương vị đậm đà, hài hòa giữa vị béo của thịt, vị chua cay mặn ngọt của nước chấm và sự thanh mát của rau sống.",
          image_url:
            "https://www.seriouseats.com/thmb/atsVhLwxdCWyX-QDuhOLhR0Kx4s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/20231204-SEA-VyTran-BunChaHanoi-18-e37d96a89a0f43d097e02311686290f2.jpg",
        },
        {
          name: "Cơm Tấm",
          price: 30000,
          description:
            "Cơm tấm Sài Gòn là món ăn dân dã nhưng rất được ưa chuộng, với hạt cơm tấm vỡ thơm dẻo, ăn kèm sườn nướng thơm phức, bì heo trộn thính và chả trứng hấp béo ngậy. Món ăn thường được phục vụ cùng nước mắm chua ngọt và dưa leo, cà chua, tạo nên sự hòa quyện hương vị đặc sắc.",
          image_url:
            "https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/163056/Originals/com-tam-2.jpg",
        },
        {
          name: "Bún Bò Huế",
          price: 45000,
          description:
            "Bún bò Huế là đặc sản miền Trung với nước dùng đậm vị, cay nồng từ sả, ớt và mắm ruốc. Món ăn gồm sợi bún to, thịt bò mềm, giò heo béo ngậy và chả Huế đặc trưng, ăn kèm rau sống tươi ngon. Đây là lựa chọn tuyệt vời cho những ai yêu thích vị cay đậm và hương thơm đặc trưng.",
          image_url:
            "https://hoasenfoods.vn/wp-content/uploads/2024/01/bun-bo-hue.jpg",
        },
        {
          name: "Mì Quảng",
          price: 35000,
          description:
            "Mì Quảng là món ăn đặc sản của Quảng Nam, nổi bật với sợi mì vàng dai, nước lèo sền sệt thơm ngon từ thịt heo, tôm và đậu phộng rang. Món ăn thường được ăn kèm với bánh tráng nướng, rau sống, chanh và ớt, tạo nên sự kết hợp hài hòa giữa các tầng hương vị đậm đà, giòn rụm và thanh mát.",
          image_url:
            "https://images2.thanhnien.vn/Uploaded/congthang/2023_01_13/mi-quang-anh-dao-ngoc-thach-2557.jpg",
        },
      ];

      // Insert side dishes
      const sideDishes = [
        {
          name: "Gỏi Cuốn",
          price: 20000,
          description:
            "Gỏi cuốn là món ăn nhẹ nổi tiếng với lớp bánh tráng mềm cuộn chặt tôm tươi, thịt heo luộc, bún, rau sống và hẹ. Món ăn thanh mát, ít dầu mỡ, thích hợp cho người ăn kiêng và rất được yêu thích vào mùa hè. Thường được ăn kèm với nước chấm tương đậu phộng béo ngậy, tạo nên hương vị hài hòa và hấp dẫn.",
          image_url:
            "https://heyyofoods.com/wp-content/uploads/2024/03/3-4.jpg",
        },
        {
          name: "Chả Giò",
          price: 25000,
          description:
            "Chả giò (nem rán) được làm từ lớp bánh tráng mỏng cuộn nhân thịt heo, miến, mộc nhĩ, cà rốt và các loại gia vị, sau đó chiên vàng giòn. Vỏ ngoài giòn rụm, bên trong mềm và đậm đà, rất thích hợp dùng kèm với nước mắm chua ngọt và rau sống. Đây là món khai vị truyền thống trong các bữa tiệc và dịp lễ.",
          image_url:
            "https://i.ytimg.com/vi/xXhweAEmOFs/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBYKJ65EfLXItpYxWckRqR-EuBtMQ",
        },
        {
          name: "Rau Muống Xào Tỏi",
          price: 15000,
          description:
            "Rau muống xào tỏi là món ăn quen thuộc trong bữa cơm gia đình Việt. Rau được chần sơ, sau đó xào với tỏi băm và một ít dầu ăn để giữ độ giòn và màu xanh đẹp mắt. Hương thơm nồng của tỏi hòa quyện với vị ngọt thanh tự nhiên của rau, tạo nên món ăn đơn giản nhưng hấp dẫn.",
          image_url:
            "https://beptruong.edu.vn/wp-content/uploads/2021/04/rau-muong-xao-toi-1.jpg",
        },
        {
          name: "Đậu Que Xào",
          price: 15000,
          description:
            "Đậu que xào là món ăn thanh đạm, dễ làm, giữ nguyên vị ngọt và độ giòn tự nhiên của đậu. Được xào nhanh trên lửa lớn cùng tỏi phi và gia vị vừa ăn, món ăn này thường được dùng để cân bằng khẩu vị trong bữa ăn, đặc biệt phù hợp cho người ăn chay hoặc thực đơn ăn kiêng.",
          image_url:
            "https://cdn.tgdd.vn/2021/07/CookRecipe/GalleryStep/dau-que-xao-toi-9.jpg",
        },
      ];

      // Insert beverages
      const beverages = [
        {
          name: "Trà Đào Cam Sả",
          price: 25000,
          description:
            "Trà đào cam sả là sự kết hợp hoàn hảo giữa hương vị ngọt thanh của đào, vị chua nhẹ của cam tươi và mùi thơm dễ chịu từ sả. Thức uống này không chỉ giúp giải nhiệt hiệu quả mà còn mang lại cảm giác thư giãn và tỉnh táo nhờ tinh dầu tự nhiên từ sả và cam. Thích hợp dùng trong những ngày nắng nóng.",
          image_url:
            "https://product.hstatic.net/200000791069/product/lord-50_5221e714bef5444aaab6759e2a219146_1024x1024.jpg",
        },
        {
          name: "Cà Phê Sữa Đá",
          price: 20000,
          description:
            "Cà phê sữa đá là thức uống đặc trưng của Việt Nam với hương vị đậm đà từ cà phê phin truyền thống hòa quyện cùng vị béo ngậy của sữa đặc. Ly cà phê mát lạnh giúp tỉnh táo tinh thần, rất được ưa chuộng vào buổi sáng hoặc giữa giờ làm việc để tăng sự tập trung.",
          image_url:
            "https://product.hstatic.net/1000287491/product/4._ca_phe_sua_da_large.jpg",
        },
        {
          name: "Sinh Tố Bơ",
          price: 30000,
          description:
            "Sinh tố bơ là thức uống bổ dưỡng, sánh mịn với vị béo tự nhiên của quả bơ chín, hòa quyện cùng sữa đặc và đá xay. Không chỉ ngon miệng mà còn giàu vitamin E, chất chống oxy hóa và chất béo lành mạnh tốt cho tim mạch và làn da. Đây là lựa chọn lý tưởng cho những ai yêu thích đồ uống ngọt dịu, thơm mát.",
          image_url:
            "https://cdn2-retail-images.kiotviet.vn/duyquangroup/e423a45a7f8749239bd70f59b0e2e87f.png",
        },
        {
          name: "Nước Chanh Tươi",
          price: 15000,
          description:
            "Nước chanh tươi là thức uống giải khát phổ biến, được pha từ nước cốt chanh tươi nguyên chất, thêm một chút đường và đá lạnh, mang lại vị chua ngọt hài hòa. Đây là lựa chọn tuyệt vời để thanh lọc cơ thể, hỗ trợ tiêu hóa và cung cấp vitamin C giúp tăng cường đề kháng.",
          image_url:
            "https://sohanews.sohacdn.com/160588918557773824/2022/5/13/photo-1-16524074652531849574994.jpg",
        },
        {
          name: "Trà Gừng",
          price: 20000,
          description:
            "Trà gừng ấm nóng được pha từ lát gừng tươi và nước sôi, có thể thêm một chút mật ong hoặc chanh để tăng hương vị. Thức uống này có tác dụng giữ ấm cơ thể, hỗ trợ tiêu hóa, giảm cảm lạnh và giảm căng thẳng. Thích hợp dùng vào buổi sáng sớm hoặc khi trời se lạnh.",
          image_url:
            "https://hinh365.com/wp-content/uploads/2020/06/cung-ngam-nhin-39-463-tam-anh-tuyet-dep-ve-ly-tra-gung-sac-net-tung-chi-tiet-2.jpg",
        },
      ];

      // Insert all items
      for (const item of mainDishes) {
        await database.runAsync(
          "INSERT INTO menu_items (name, price, description, image_url, category_id) VALUES (?, ?, ?, ?, ?)",
          [
            item.name,
            item.price,
            item.description,
            item.image_url,
            mainDishCategory.id,
          ]
        );
      }

      for (const item of sideDishes) {
        await database.runAsync(
          "INSERT INTO menu_items (name, price, description, image_url, category_id) VALUES (?, ?, ?, ?, ?)",
          [
            item.name,
            item.price,
            item.description,
            item.image_url,
            sideDishCategory.id,
          ]
        );
      }

      for (const item of beverages) {
        await database.runAsync(
          "INSERT INTO menu_items (name, price, description, image_url, category_id) VALUES (?, ?, ?, ?, ?)",
          [
            item.name,
            item.price,
            item.description,
            item.image_url,
            beverageCategory.id,
          ]
        );
      }
    }

    // Add sample tables if tables table is empty
    const tableCount = await database.getFirstAsync(
      "SELECT COUNT(*) as count FROM tables"
    );
    if (!tableCount || tableCount.count === 0) {
      await database.runAsync(
        "INSERT INTO tables (name, status) VALUES (?, ?)",
        ["Bàn 1", "empty"]
      );
      await database.runAsync(
        "INSERT INTO tables (name, status) VALUES (?, ?)",
        ["Bàn 2", "empty"]
      );
      await database.runAsync(
        "INSERT INTO tables (name, status) VALUES (?, ?)",
        ["Bàn 3", "empty"]
      );
    }
  } catch (error) {
    console.error("Error inserting sample data:", error);
    throw error;
  }
}

// Always export initDb to ensure a valid database instance
export default initDb;
