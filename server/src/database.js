const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Ensure the data directory exists
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, "lumber-sales.db");
const db = new Database(dbPath, { verbose: console.log });

// Create tables if they don't exist
const initDb = () => {
  // Create party_types table
  db.exec(`
    CREATE TABLE IF NOT EXISTS party_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create parties table
  db.exec(`
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      list_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create party_type_mappings table for many-to-many relationship
  db.exec(`
    CREATE TABLE IF NOT EXISTS party_type_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      party_type_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties (id) ON DELETE CASCADE,
      FOREIGN KEY (party_type_id) REFERENCES party_types (id) ON DELETE CASCADE,
      UNIQUE (party_id, party_type_id)
    )
  `);

  // Create customers table (updated to remove tax_id and add sales_tax_exempt and default_ship_via_id)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      default_billing_address_id INTEGER,
      default_shipping_address_id INTEGER,
      default_ship_via_id INTEGER,
      sales_tax_exempt BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties (id) ON DELETE CASCADE,
      FOREIGN KEY (default_ship_via_id) REFERENCES ship_via (id)
    )
  `);

  // Create vendors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      default_address_id INTEGER,
      account_number TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties (id) ON DELETE CASCADE
    )
  `);

  // Create sales_tax table
  db.exec(`
  CREATE TABLE IF NOT EXISTS sales_tax (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    county TEXT NOT NULL,
    state TEXT NOT NULL,
    tax_rate REAL NOT NULL,
    effective_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

  // Create ship_via table
  db.exec(`
  CREATE TABLE IF NOT EXISTS ship_via (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

  // Create addresses table (updated to include county and sales_tax_id)
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      county TEXT,
      postal_code TEXT NOT NULL,
      country TEXT DEFAULT 'USA',
      sales_tax_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sales_tax_id) REFERENCES sales_tax (id)
    )
  `);

  // Create party_addresses junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS party_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      address_id INTEGER NOT NULL,
      address_type TEXT NOT NULL, -- 'billing', 'shipping', 'both'
      is_default BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties (id) ON DELETE CASCADE,
      FOREIGN KEY (address_id) REFERENCES addresses (id) ON DELETE CASCADE,
      UNIQUE (party_id, address_id, address_type)
    )
  `);

  // Create species table
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      list_name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Drop the existing tickets table if it exists
  // WARNING: This will delete all existing tickets!
  db.exec(`DROP TABLE IF EXISTS tickets`);

  // Drop the existing ticket_items table if it exists
  db.exec(`DROP TABLE IF EXISTS ticket_items`);

  // Create tickets table with new fields including ship_via_id and sales_tax_id
  db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    invoice_number INTEGER UNIQUE,
    party_id INTEGER NOT NULL,
    billing_address_id INTEGER,
    shipping_address_id INTEGER,
    ship_via_id INTEGER,
    sales_tax_id INTEGER,
    customerName TEXT NOT NULL,
    customerPhone TEXT,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'invoice', -- 'quote', 'purchase order', 'bill of lading', 'void'
    total_bf REAL DEFAULT 0,
    total_tax REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties (id),
    FOREIGN KEY (billing_address_id) REFERENCES addresses (id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses (id),
    FOREIGN KEY (ship_via_id) REFERENCES ship_via (id),
    FOREIGN KEY (sales_tax_id) REFERENCES sales_tax (id)
  )
 `);

  // Create the sequence for invoice_number starting at 29999 (so first one will be 30000)
  try {
    // Check if sequence already exists
    const checkSeq = db
      .prepare(
        `
    SELECT seq FROM sqlite_sequence WHERE name = 'tickets'
  `
      )
      .get();

    if (!checkSeq) {
      // Initialize the sequence
      db.prepare(
        `
      INSERT INTO sqlite_sequence (name, seq) VALUES ('tickets', 29999)
    `
      ).run();
      console.log("Initialized invoice number sequence to start at 30000");
    }
  } catch (error) {
    console.log("Error setting invoice number sequence:", error.message);
  }

  // Create ticket_items table with new fields including tax_amount
  // TODO: tax_amount needs deleted & be sure total_tax is used instead
  db.exec(`
  CREATE TABLE IF NOT EXISTS ticket_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId TEXT NOT NULL,
    species_id INTEGER, -- Changed to be nullable (no NOT NULL constraint)
    quantity INTEGER NOT NULL,
    thickness REAL NOT NULL,
    width REAL NOT NULL,
    length REAL NOT NULL,
    price_per_mbf REAL NOT NULL,
    total_bf REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_tax REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticketId) REFERENCES tickets (id) ON DELETE CASCADE,
    FOREIGN KEY (species_id) REFERENCES species (id) -- The species can be null
  )
`);

  // Create trigger to update the updated_at timestamp for parties
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_parties_timestamp
    AFTER UPDATE ON parties
    BEGIN
      UPDATE parties SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  // Add similar triggers for all other tables
  const tables = [
    "party_types",
    "party_type_mappings",
    "customers",
    "vendors",
    "addresses",
    "party_addresses",
    "species",
    "tickets",
    "ticket_items",
  ];

  for (const table of tables) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_${table}_timestamp
      AFTER UPDATE ON ${table}
      BEGIN
        UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
  }

  console.log("Database initialized successfully");
};

// Initialize the database
initDb();

// Export the database instance
module.exports = db;
