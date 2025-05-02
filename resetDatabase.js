import { dropAllTables, initDatabase } from "./database/database";

const resetDatabase = async () => {
  try {
    console.log("Starting database reset...");

    // Initialize database to get the database instance
    const db = await initDatabase();

    // Drop all tables
    console.log("Dropping all tables...");
    await dropAllTables(db);

    // Reinitialize database with new data
    console.log("Reinitializing database with new data...");
    await initDatabase();

    console.log("Database reset completed successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
  }
};

// Run the reset
resetDatabase();
