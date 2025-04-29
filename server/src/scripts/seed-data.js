/**
 * Seed script to populate the database with initial test data
 * 
 * Run this script with Node.js:
 * node src/scripts/seed-data.js
 */

const db = require('../database');
const path = require('path');
const fs = require('fs');

console.log('Starting database seeding...');

// Helper function to run SQL in a transaction
const runTransaction = (callback) => {
  const transaction = db.transaction(callback);
  return transaction();
};

// Clear existing data
const clearDatabase = () => {
  console.log('Clearing existing data...');
  
  // Drop existing data from tables
  const tables = [
    'party_type_mappings',
    'party_types',
    'party_addresses',
    'customers',
    'vendors',
    'addresses',
    'species',
    'ticket_items',
    'tickets',
    'parties'
  ];
  
  runTransaction(() => {
    tables.forEach(table => {
      try {
        db.prepare(`DELETE FROM ${table}`).run();
        console.log(`Cleared table: ${table}`);
      } catch (error) {
        console.error(`Error clearing table ${table}:`, error.message);
      }
    });
  });
  
  console.log('Existing data cleared.');
};

// Seed party types
const seedPartyTypes = () => {
  console.log('Seeding party types...');
  
  const partyTypes = [
    { name: 'customer', description: 'Customer party type' },
    { name: 'vendor', description: 'Vendor party type' },
    { name: 'both', description: 'Both customer and vendor' }
  ];
  
  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO party_types (name, description)
      VALUES (?, ?)
    `);
    
    partyTypes.forEach(type => {
      try {
        stmt.run(type.name, type.description);
      } catch (error) {
        console.error(`Error inserting party type ${type.name}:`, error.message);
      }
    });
  });
  
  console.log('Party types seeded.');
};

// Seed parties
const seedParties = () => {
  console.log('Seeding parties...');
  
  const parties = [
    { 
      party_number: 'C001', 
      name: 'Johnson Construction', 
      phone: '706-555-0101', 
      email: 'info@johnsonconstruction.example.com',
      notes: 'Large commercial builder, regular customer'
    },
    { 
      party_number: 'C002', 
      name: 'Smith Home Builders', 
      phone: '706-555-0102', 
      email: 'contact@smithhomebuilders.example.com',
      notes: 'Residential builder, monthly orders'
    },
    { 
      party_number: 'C003', 
      name: 'Mountain Cabins Inc', 
      phone: '706-555-0103', 
      email: 'sales@mountaincabins.example.com',
      notes: 'Specializes in vacation cabins'
    },
    { 
      party_number: 'C004', 
      name: 'Carter Renovations', 
      phone: '706-555-0104', 
      email: 'jim@carterrenovations.example.com',
      notes: 'Small renovation company, prefers oak'
    },
    { 
      party_number: 'C005', 
      name: 'Blue Ridge Woodworkers', 
      phone: '706-555-0105', 
      email: 'workshop@brwoodworkers.example.com',
      notes: 'Custom furniture maker, buys high-grade hardwoods'
    }
  ];
  
  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO parties (party_number, name, list_name, phone, email, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    parties.forEach(party => {
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
  
  console.log('Parties seeded.');
};

// Seed customers
const seedCustomers = () => {
  console.log('Seeding customers...');
  
  // Get party IDs
  const parties = db.prepare(`SELECT id, party_number FROM parties`).all();
  
  runTransaction(() => {
    // Insert customers
    const customerStmt = db.prepare(`
      INSERT INTO customers (party_id, tax_exempt, tax_id)
      VALUES (?, ?, ?)
    `);
    
    // Insert party type mappings
    const mappingStmt = db.prepare(`
      INSERT INTO party_type_mappings (party_id, party_type_id)
      VALUES (?, (SELECT id FROM party_types WHERE name = 'customer'))
    `);
    
    parties.forEach(party => {
      try {
        // Make one of the customers tax exempt
        const taxExempt = party.party_number === 'C001' ? 1 : 0;
        const taxId = taxExempt ? '123-45-6789' : null;
        
        customerStmt.run(party.id, taxExempt, taxId);
        mappingStmt.run(party.id);
      } catch (error) {
        console.error(`Error inserting customer for party ${party.id}:`, error.message);
      }
    });
  });
  
  console.log('Customers seeded.');
};

// Seed addresses
const seedAddresses = () => {
  console.log('Seeding addresses...');
  
  const addresses = [
    {
      address_line1: '123 Main St',
      address_line2: 'Suite 101',
      city: 'Ellijay',
      state: 'GA',
      postal_code: '30540',
      country: 'USA'
    },
    {
      address_line1: '456 Oak Ave',
      address_line2: null,
      city: 'Ellijay',
      state: 'GA',
      postal_code: '30540',
      country: 'USA'
    },
    {
      address_line1: '789 Pine Ln',
      address_line2: 'Building B',
      city: 'Blue Ridge',
      state: 'GA',
      postal_code: '30513',
      country: 'USA'
    },
    {
      address_line1: '321 Cedar Rd',
      address_line2: null,
      city: 'Jasper',
      state: 'GA',
      postal_code: '30143',
      country: 'USA'
    },
    {
      address_line1: '555 Maple Dr',
      address_line2: 'Unit 200',
      city: 'Ellijay',
      state: 'GA',
      postal_code: '30540',
      country: 'USA'
    },
    {
      address_line1: '999 Spruce Way',
      address_line2: null,
      city: 'Blue Ridge',
      state: 'GA',
      postal_code: '30513',
      country: 'USA'
    },
    {
      address_line1: '777 Hickory Ct',
      address_line2: null,
      city: 'Jasper',
      state: 'GA',
      postal_code: '30143',
      country: 'USA'
    }
  ];
  
  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO addresses (address_line1, address_line2, city, state, postal_code, country)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    addresses.forEach(address => {
      try {
        stmt.run(
          address.address_line1,
          address.address_line2,
          address.city,
          address.state,
          address.postal_code,
          address.country
        );
      } catch (error) {
        console.error(`Error inserting address ${address.address_line1}:`, error.message);
      }
    });
  });
  
  console.log('Addresses seeded.');
};

// Seed party addresses
const seedPartyAddresses = () => {
  console.log('Seeding party addresses...');
  
  const parties = db.prepare(`SELECT id FROM parties`).all();
  const addresses = db.prepare(`SELECT id FROM addresses`).all();
  
  // Assign multiple addresses to parties
  const assignments = [
    { partyIndex: 0, addressIndices: [0, 1], types: ['billing', 'shipping'] },
    { partyIndex: 1, addressIndices: [2, 2], types: ['billing', 'shipping'] },
    { partyIndex: 2, addressIndices: [3, 4], types: ['billing', 'shipping'] },
    { partyIndex: 3, addressIndices: [5, 5], types: ['both', 'both'] },
    { partyIndex: 4, addressIndices: [6, 6], types: ['both', 'both'] }
  ];
  
  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO party_addresses (party_id, address_id, address_type, is_default)
      VALUES (?, ?, ?, ?)
    `);
    
    assignments.forEach(assignment => {
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
  });
  
  console.log('Party addresses seeded.');
};

// Seed species
const seedSpecies = () => {
  console.log('Seeding species...');
  
  const speciesList = [
    { species_number: 'SPF', name: 'Spruce-Pine-Fir', description: 'SPF lumber is a grouping of various species' },
    { species_number: 'SYP', name: 'Southern Yellow Pine', description: 'Dense and strong softwood' },
    { species_number: 'DF', name: 'Douglas Fir', description: 'Straight, true, strong softwood' },
    { species_number: 'HEM', name: 'Hemlock', description: 'Light softwood with straight grain' },
    { species_number: 'OAK', name: 'Red Oak', description: 'Hardwood with strong grain pattern' },
    { species_number: 'POP', name: 'Poplar', description: 'Economical hardwood, easy to work with' },
    { species_number: 'MAP', name: 'Maple', description: 'Hard, dense wood with uniform texture' },
    { species_number: 'CED', name: 'Cedar', description: 'Aromatic, naturally resistant to decay' },
    { species_number: 'ASH', name: 'Ash', description: 'Strong hardwood with excellent flexibility' },
    { species_number: 'CHE', name: 'Cherry', description: 'Premium hardwood with rich color' }
  ];
  
  runTransaction(() => {
    const stmt = db.prepare(`
      INSERT INTO species (species_number, name, list_name, description)
      VALUES (?, ?, ?, ?)
    `);
    
    speciesList.forEach(species => {
      try {
        const list_name = `${species.species_number} - ${species.name}`;
        stmt.run(
          species.species_number,
          species.name,
          list_name,
          species.description
        );
      } catch (error) {
        console.error(`Error inserting species ${species.name}:`, error.message);
      }
    });
  });
  
  console.log('Species seeded.');
};

// Run all seed functions
const seedAll = () => {
  // Clear existing data first
  clearDatabase();
  
  // Seed tables in order
  seedPartyTypes();
  seedParties();
  seedCustomers();
  seedAddresses();
  seedPartyAddresses();
  seedSpecies();
  
  console.log('Database seeding completed successfully!');
};

// Run the seeding process
seedAll();