const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const dbPath = path.join(__dirname, "..", "..", "data", "lumber-sales.db");
const db = new Database(dbPath);

console.log("Adding distribution fields to database...");

try {
  // Check if distribution_total column exists in tickets table
  const ticketsColumns = db.pragma(`table_info(tickets)`);
  const hasDistributionTotal = ticketsColumns.some(
    (col) => col.name === "distribution_total"
  );

  if (!hasDistributionTotal) {
    db.exec(
      `ALTER TABLE tickets ADD COLUMN distribution_total INTEGER DEFAULT 0`
    );
    console.log("Added distribution_total column to tickets table");
  } else {
    console.log("distribution_total column already exists in tickets table");
  }

  // Check if distribution_number column exists in ticket_items table
  const itemsColumns = db.pragma(`table_info(ticket_items)`);
  const hasDistributionNumber = itemsColumns.some(
    (col) => col.name === "distribution_number"
  );

  if (!hasDistributionNumber) {
    db.exec(
      `ALTER TABLE ticket_items ADD COLUMN distribution_number INTEGER DEFAULT 0`
    );
    console.log("Added distribution_number column to ticket_items table");
  } else {
    console.log(
      "distribution_number column already exists in ticket_items table"
    );
  }

  console.log("Database migration completed successfully!");
} catch (error) {
  console.error("Error during migration:", error);
} finally {
  db.close();
}
