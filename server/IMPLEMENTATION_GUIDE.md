# Lumber Sales App Enhancement Implementation Guide

This guide outlines the steps to implement the database and UI enhancements for the Lumber Sales application. The changes include extended data models, customer and species management, and enhanced ticket forms.

## Implementation Steps

Follow these steps in order to implement the changes:

### 1. Database Schema Updates

1. First, replace the `src/database.js` file with the updated version that includes:
   - New `created_at` and `updated_at` fields for all tables
   - New tables for parties, customers, vendors, addresses, party_addresses, and species
   - Updated tables for tickets and ticket_items with new fields

2. Delete the existing database file to start fresh:
   ```bash
   rm data/lumber-sales.db
   ```

### 2. Update Backend Models

1. Update the existing `src/models/ticket.js` file with the new version
2. Create new model files:
   - `src/models/party.js`
   - `src/models/customer.js`
   - `src/models/address.js`
   - `src/models/species.js`

### 3. Update Backend Controllers

1. Update the existing `src/controllers/tickets.js` file
2. Create new controller files:
   - `src/controllers/parties.js`
   - `src/controllers/customers.js`
   - `src/controllers/addresses.js`
   - `src/controllers/species.js`

### 4. Update Backend Routes

1. Update the main routes file `src/routes/index.js`
2. Create new route files:
   - `src/routes/parties.js`
   - `src/routes/customers.js`
   - `src/routes/addresses.js`
   - `src/routes/species.js`

### 5. Update Frontend API Service

1. Update the `src/services/api.js` file to include the new API endpoints

### 6. Update Frontend Components

1. Update the existing components:
   - `src/components/TicketForm.vue`
   - `src/components/TicketList.vue`
   - `src/components/PrintTicket.vue`

### 7. Seed Initial Data

1. Create a new directory for scripts if it doesn't exist:
   ```bash
   mkdir -p src/scripts
   ```
2. Create the seed script file `src/scripts/seed-data.js`
3. Run the seed script to populate the database with test data:
   ```bash
   node src/scripts/seed-data.js
   ```

### 8. Start the Application

1. Start the backend server:
   ```bash
   npm run dev
   ```
2. In a separate terminal, start the frontend development server:
   ```bash
   cd ../frontend  # if you're in the backend directory
   npm run serve
   ```

## Key Changes Summary

### Database Schema Changes

- Added `created_at` and `updated_at` timestamps to all tables
- New tables:
  - `parties`: Base table for customers and vendors
  - `party_types`: Types of parties (customer, vendor)
  - `party_type_mappings`: Many-to-many relationship for parties and types
  - `customers`: Customer-specific data linked to parties
  - `vendors`: Vendor-specific data linked to parties
  - `addresses`: Physical addresses
  - `party_addresses`: Linking parties to addresses with address types
  - `species`: Wood species catalog

- Modified tables:
  - `tickets`: Added invoice_number, party_id, addresses, status, total_bf, total_tax
  - `ticket_items`: Added species_id, changed height to thickness, price_per_bf to price_per_mbf

### UI Changes

- Customer autocomplete on ticket form
- Species dropdown for each lumber item
- Board feet calculation and display
- Tax calculation (currently set to 0%)
- Address management for customers

## Testing the Changes

1. Create a new ticket by selecting one of the seeded customers
2. Select addresses for billing and shipping
3. Add items with different species
4. Verify that board feet calculations work correctly
5. Save and print the ticket
6. View the ticket list and verify the new fields are displayed

## Next Steps and Recommendations

After completing this implementation, consider the following enhancements for future versions:

1. Add a customer management UI to create, edit, and view customers
2. Add a species management UI to manage the wood species catalog
3. Implement tax calculation based on customer tax status
4. Add filtering and sorting to the ticket list
5. Implement a reporting system for sales analysis
6. Add user authentication and permissions

These improvements will be part of the second build phase of the project.