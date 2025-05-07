/**
 * Seed script to populate the database with initial test data
 *
 * Run this script with Node.js:
 * node src/scripts/seed-data.js
 */

const db = require("../database");
const path = require("path");
const fs = require("fs");

console.log("Starting database seeding...");

// Helper function to run SQL in a transaction
const runTransaction = (callback) => {
  const transaction = db.transaction(callback);
  return transaction();
};

// Clear existing data
const clearDatabase = () => {
  console.log("Clearing existing data...");

  // Drop existing data from tables
  const tables = [
    "party_type_mappings",
    "party_types",
    "party_addresses",
    "customers",
    "vendors",
    "addresses",
    "species",
    "ticket_items",
    "tickets",
    "parties",
    "sales_tax",
    "ship_via",
  ];

  runTransaction(() => {
    tables.forEach((table) => {
      try {
        db.prepare(`DELETE FROM ${table}`).run();
        console.log(`Cleared table: ${table}`);
      } catch (error) {
        console.error(`Error clearing table ${table}:`, error.message);
      }
    });
  });

  console.log("Existing data cleared.");
};

// Seed sales tax
const seedSalesTax = () => {
  console.log("Seeding sales tax rates...");

  const salesTaxes = [
    {
      name: "Gilmer County, GA",
      county: "Gilmer",
      state: "GA",
      tax_rate: 0.05,
      effective_date: "2020-01-01",
    },
    {
      name: "Fannin County, GA",
      county: "Fannin",
      state: "GA",
      tax_rate: 0.07,
      effective_date: "2020-01-01",
    },
    {
      name: "Pickens County Sales Tax",
      county: "Pickens",
      state: "GA",
      tax_rate: 0.07,
      effective_date: "2020-01-01",
    },
    {
      name: "Gordon County Sales Tax",
      county: "Gordon",
      state: "GA",
      tax_rate: 0.07,
      effective_date: "2020-01-01",
    },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO sales_tax (name, county, state, tax_rate, effective_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    salesTaxes.forEach((tax) => {
      try {
        stmt.run(
          tax.name,
          tax.county,
          tax.state,
          tax.tax_rate,
          tax.effective_date
        );
      } catch (error) {
        console.error(`Error inserting sales tax ${tax.name}:`, error.message);
      }
    });
  });

  console.log("Sales tax rates seeded.");
};

// Seed shipping methods
const seedShipVia = () => {
  console.log("Seeding shipping methods...");

  const shipViaMethods = [
    {
      name: "Pickup",
      description: "Customer picks up order at the mill",
    },
    {
      name: "Delivery",
      description: "Order delivered to customer location",
    },
    {
      name: "Freight",
      description: "Order shipped via freight carrier",
    },
    {
      name: "Transfer",
      description: "Internal transfer between locations",
    },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO ship_via (name, description)
      VALUES (?, ?)
    `);

    shipViaMethods.forEach((method) => {
      try {
        stmt.run(method.name, method.description);
      } catch (error) {
        console.error(
          `Error inserting shipping method ${method.name}:`,
          error.message
        );
      }
    });
  });

  console.log("Shipping methods seeded.");
};

// Seed party types
const seedPartyTypes = () => {
  console.log("Seeding party types...");

  const partyTypes = [
    { name: "customer", description: "Customer party type" },
    { name: "vendor", description: "Vendor party type" },
    { name: "both", description: "Both customer and vendor" },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO party_types (name, description)
      VALUES (?, ?)
    `);

    partyTypes.forEach((type) => {
      try {
        stmt.run(type.name, type.description);
      } catch (error) {
        console.error(
          `Error inserting party type ${type.name}:`,
          error.message
        );
      }
    });
  });

  console.log("Party types seeded.");
};

// Seed parties
const seedParties = () => {
  console.log("Seeding parties...");

  const parties = [
    {
      party_number: "7",
      name: "Honest Abe",
      phone: "706-555-0101",
      email: "info@johnsonconstruction.example.com",
      notes: "Large commercial builder, regular customer",
    },
    {
      party_number: "23",
      name: "Ellijay Lumber",
      phone: "706-555-0102",
      email: "contact@smithhomebuilders.example.com",
      notes: "Residential builder, monthly orders",
    },
    {
      party_number: "44",
      name: "Babb",
      phone: "706-555-0103",
      email: "sales@mountaincabins.example.com",
      notes: "Specializes in vacation cabins",
    },
    {
      party_number: "86",
      name: "Koppers",
      phone: "706-555-0104",
      email: "jim@carterrenovations.example.com",
      notes: "Small renovation company, prefers oak",
    },
    {
      party_number: "87",
      name: "Trull",
      phone: "706-555-0105",
      email: "workshop@brwoodworkers.example.com",
      notes: "Custom furniture maker, buys high-grade hardwoods",
    },
    {
      party_number: "89",
      name: "Cor-Tenn",
      phone: "706-555-0105",
      email: "workshop@brwoodworkers.example.com",
      notes: "Custom furniture maker, buys high-grade hardwoods",
    },
    {
      party_number: "96",
      name: "CP Wilbanks",
      phone: "706-555-0105",
      email: "workshop@brwoodworkers.example.com",
      notes: "Custom furniture maker, buys high-grade hardwoods",
    },
    {
      party_number: "103",
      name: "Tree Brand",
      phone: "706-555-0105",
      email: "workshop@brwoodworkers.example.com",
      notes: "Custom furniture maker, buys high-grade hardwoods",
    },
    {
      party_number: "144",
      name: "Albemarle",
      phone: "706-555-0105",
      email: "workshop@brwoodworkers.example.com",
      notes: "Custom furniture maker, buys high-grade hardwoods",
    },
    {
      party_number: "545",
      name: "Sparks Lumber Company",
      phone: "706-678-4047",
      email: "info@sparkslumber.example.com",
      notes: "Sawmill and lumber supplier",
    },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO parties (party_number, name, list_name, phone, email, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    parties.forEach((party) => {
      try {
        const list_name = `${party.party_number} - ${party.name}`;
        stmt.run(
          party.party_number,
          party.name,
          list_name,
          party.phone,
          party.email,
          party.notes
        );
      } catch (error) {
        console.error(`Error inserting party ${party.name}:`, error.message);
      }
    });
  });

  console.log("Parties seeded.");
};

// Seed customers
const seedCustomers = () => {
  console.log("Seeding customers...");

  // Get party IDs
  const parties = db.prepare(`SELECT id, party_number FROM parties`).all();

  // Get ship via methods
  const shipViaMethods = db.prepare(`SELECT id, name FROM ship_via`).all();
  const pickupMethod = shipViaMethods.find((m) => m.name === "Pickup");
  const deliveryMethod = shipViaMethods.find((m) => m.name === "Delivery");

  runTransaction(() => {
    // Insert customers
    const customerStmt = db.prepare(`
      INSERT INTO customers (party_id, default_ship_via_id, sales_tax_exempt)
      VALUES (?, ?, ?)
    `);

    // Insert party type mappings
    const mappingStmt = db.prepare(`
      INSERT INTO party_type_mappings (party_id, party_type_id)
      VALUES (?, (SELECT id FROM party_types WHERE name = 'customer'))
    `);

    parties.forEach((party) => {
      try {
        // Make a couple of customers tax exempt
        const taxExempt =
          party.party_number === "7" || party.party_number === "103" ? 1 : 0;

        // Alternate between pickup and delivery for default ship via
        const defaultShipViaId =
          party.id % 2 === 0 ? pickupMethod.id : deliveryMethod.id;

        customerStmt.run(party.id, defaultShipViaId, taxExempt);
        mappingStmt.run(party.id);
      } catch (error) {
        console.error(
          `Error inserting customer for party ${party.id}:`,
          error.message
        );
      }
    });
  });

  console.log("Customers seeded.");
};

// Seed addresses
const seedAddresses = () => {
  console.log("Seeding addresses...");

  // Get sales tax rates
  const salesTaxRates = db
    .prepare(`SELECT id, county, state FROM sales_tax`)
    .all();
  const gilmerTax = salesTaxRates.find(
    (tax) => tax.county === "Gilmer" && tax.state === "GA"
  );
  const fanninTax = salesTaxRates.find(
    (tax) => tax.county === "Fannin" && tax.state === "GA"
  );
  const pickensTax = salesTaxRates.find(
    (tax) => tax.county === "Pickens" && tax.state === "GA"
  );

  const addresses = [
    {
      address_line1: "123 Main St",
      address_line2: "Suite 101",
      city: "Ellijay",
      state: "GA",
      county: "Gilmer",
      postal_code: "30540",
      country: "USA",
      sales_tax_id: gilmerTax?.id,
    },
    {
      address_line1: "456 Oak Ave",
      address_line2: null,
      city: "Ellijay",
      state: "GA",
      county: "Gilmer",
      postal_code: "30540",
      country: "USA",
      sales_tax_id: gilmerTax?.id,
    },
    {
      address_line1: "789 Pine Ln",
      address_line2: "Building B",
      city: "Blue Ridge",
      state: "GA",
      county: "Fannin",
      postal_code: "30513",
      country: "USA",
      sales_tax_id: fanninTax?.id,
    },
    {
      address_line1: "321 Cedar Rd",
      address_line2: null,
      city: "Jasper",
      state: "GA",
      county: "Pickens",
      postal_code: "30143",
      country: "USA",
      sales_tax_id: pickensTax?.id,
    },
    {
      address_line1: "555 Maple Dr",
      address_line2: "Unit 200",
      city: "Ellijay",
      state: "GA",
      county: "Gilmer",
      postal_code: "30540",
      country: "USA",
      sales_tax_id: gilmerTax?.id,
    },
    {
      address_line1: "999 Spruce Way",
      address_line2: null,
      city: "Blue Ridge",
      state: "GA",
      county: "Fannin",
      postal_code: "30513",
      country: "USA",
      sales_tax_id: fanninTax?.id,
    },
    {
      address_line1: "777 Hickory Ct",
      address_line2: null,
      city: "Jasper",
      state: "GA",
      county: "Pickens",
      postal_code: "30143",
      country: "USA",
      sales_tax_id: pickensTax?.id,
    },
    {
      address_line1: "9222 Highway 515 S",
      address_line2: null,
      city: "Ellijay",
      state: "GA",
      county: "Gilmer",
      postal_code: "30540",
      country: "USA",
      sales_tax_id: gilmerTax?.id,
    },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO addresses (
        address_line1, address_line2, city, state, county, postal_code, country, sales_tax_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    addresses.forEach((address) => {
      try {
        stmt.run(
          address.address_line1,
          address.address_line2,
          address.city,
          address.state,
          address.county,
          address.postal_code,
          address.country,
          address.sales_tax_id
        );
      } catch (error) {
        console.error(
          `Error inserting address ${address.address_line1}:`,
          error.message
        );
      }
    });
  });

  console.log("Addresses seeded.");
};

// Seed party addresses
const seedPartyAddresses = () => {
  console.log("Seeding party addresses...");

  const parties = db
    .prepare(`SELECT id, party_number, name FROM parties`)
    .all();
  const addresses = db.prepare(`SELECT id, address_line1 FROM addresses`).all();

  // Find Sparks Lumber Company party and the 9222 Highway 515 S address
  const sparksLumber = parties.find((p) => p.name === "Sparks Lumber Company");
  const sparksAddress = addresses.find(
    (a) => a.address_line1 === "9222 Highway 515 S"
  );

  // Assign multiple addresses to parties
  const assignments = [
    { partyIndex: 0, addressIndices: [0, 1], types: ["billing", "shipping"] },
    { partyIndex: 1, addressIndices: [2, 2], types: ["billing", "shipping"] },
    { partyIndex: 2, addressIndices: [3, 4], types: ["billing", "shipping"] },
    { partyIndex: 3, addressIndices: [5, 5], types: ["both", "both"] },
    { partyIndex: 4, addressIndices: [6, 6], types: ["both", "both"] },
    { partyIndex: 5, addressIndices: [7, 7], types: ["both", "both"] },
    { partyIndex: 6, addressIndices: [8, 8], types: ["both", "both"] },
    { partyIndex: 7, addressIndices: [6, 8], types: ["both", "both"] },
    { partyIndex: 8, addressIndices: [6, 5], types: ["both", "both"] },
    { partyIndex: 9, addressIndices: [4, 3], types: ["both", "both"] },
    { partyIndex: 10, addressIndices: [8, 1], types: ["both", "both"] },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO party_addresses (party_id, address_id, address_type, is_default)
      VALUES (?, ?, ?, ?)
    `);

    // Assign the addresses for regular parties
    assignments.forEach((assignment) => {
      try {
        const party = parties[assignment.partyIndex];

        assignment.addressIndices.forEach((addressIndex, i) => {
          const address = addresses[addressIndex];
          const addressType = assignment.types[i];
          const isDefault = 1; // Make all default for simplicity

          stmt.run(party.id, address.id, addressType, isDefault);
        });
      } catch (error) {
        console.error(`Error inserting party address:`, error.message);
      }
    });

    // If we found Sparks Lumber and its address, assign it
    if (sparksLumber && sparksAddress) {
      try {
        // Assign as both billing and shipping with default=true
        stmt.run(sparksLumber.id, sparksAddress.id, "both", 1);
      } catch (error) {
        console.error(
          `Error inserting address for Sparks Lumber:`,
          error.message
        );
      }
    }
  });

  console.log("Party addresses seeded.");
};

// Seed species
const seedSpecies = () => {
  console.log("Seeding species...");

  const speciesList = [
    {
      species_number: "1",
      name: "Yellow Pine",
      description: "Southern Yellow Pine - Dense and strong softwood",
    },
    {
      species_number: "2",
      name: "White Pine",
      description: "White Pine - Clear softwood",
    },
    {
      species_number: "3",
      name: "Hardwood",
      description: "Premium hardwood - Oak, Cherry, etc.",
    },
    {
      species_number: "5",
      name: "Poplar",
      description: "Economical hardwood, easy to work with",
    },
    {
      species_number: "6",
      name: "Hemlock",
      description: "Light softwood with straight grain",
    },
    {
      species_number: "9",
      name: "Red Oak",
      description: "Hardwood with strong grain pattern",
    },
  ];

  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO species (species_number, name, list_name, description)
      VALUES (?, ?, ?, ?)
    `);

    speciesList.forEach((species) => {
      try {
        const list_name = `${species.species_number} - ${species.name}`;
        stmt.run(
          species.species_number,
          species.name,
          list_name,
          species.description
        );
      } catch (error) {
        console.error(
          `Error inserting species ${species.name}:`,
          error.message
        );
      }
    });
  });

  console.log("Species seeded.");
};

// Run all seed functions
const seedAll = () => {
  // Clear existing data first
  clearDatabase();

  // Seed tables in order
  seedSalesTax();
  seedShipVia();
  seedPartyTypes();
  seedParties();
  seedCustomers();
  seedAddresses();
  seedPartyAddresses();
  seedSpecies();

  console.log("Database seeding completed successfully!");
};

// Run the seeding process
seedAll();
