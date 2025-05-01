const db = require('../database');

const CustomerModel = {
  /**
   * Get all customers with party information
   * @returns {Array} Array of customer objects with party info
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT c.*, 
             p.party_number, p.name, p.list_name, p.phone, p.email, p.notes,
             sv.name as ship_via_name, sv.description as ship_via_description
      FROM customers c
      JOIN parties p ON c.party_id = p.id
      LEFT JOIN ship_via sv ON c.default_ship_via_id = sv.id
      ORDER BY p.list_name ASC
    `);
    return stmt.all();
  },

  /**
   * Get customer by ID with party information
   * @param {number} id - Customer ID
   * @returns {Object|null} Customer object with party info
   */
  getById(id) {
    const stmt = db.prepare(`
      SELECT c.*, 
             p.party_number, p.name, p.list_name, p.phone, p.email, p.notes,
             sv.name as ship_via_name, sv.description as ship_via_description
      FROM customers c
      JOIN parties p ON c.party_id = p.id
      LEFT JOIN ship_via sv ON c.default_ship_via_id = sv.id
      WHERE c.id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get customer by party ID
   * @param {number} partyId - Party ID
   * @returns {Object|null} Customer object
   */
  getByPartyId(partyId) {
    const stmt = db.prepare(`
      SELECT c.*, 
             p.party_number, p.name, p.list_name, p.phone, p.email, p.notes,
             sv.name as ship_via_name, sv.description as ship_via_description
      FROM customers c
      JOIN parties p ON c.party_id = p.id
      LEFT JOIN ship_via sv ON c.default_ship_via_id = sv.id
      WHERE c.party_id = ?
    `);
    return stmt.get(partyId);
  },

  /**
   * Create a new customer
   * @param {Object} customer - Customer object
   * @returns {Object} Created customer
   */
  create(customer) {
    const stmt = db.prepare(`
      INSERT INTO customers (
        party_id, default_billing_address_id, default_shipping_address_id,
        default_ship_via_id, sales_tax_exempt
      )
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      customer.party_id,
      customer.default_billing_address_id || null,
      customer.default_shipping_address_id || null,
      customer.default_ship_via_id || null,
      customer.sales_tax_exempt ? 1 : 0
    );

    // Add customer to party_type_mappings
    this.addCustomerType(customer.party_id);
    
    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a customer
   * @param {number} id - Customer ID
   * @param {Object} customer - Updated customer data
   * @returns {Object} Updated customer
   */
  update(id, customer) {
    const stmt = db.prepare(`
      UPDATE customers
      SET default_billing_address_id = ?,
          default_shipping_address_id = ?,
          default_ship_via_id = ?,
          sales_tax_exempt = ?
      WHERE id = ?
    `);
    
    stmt.run(
      customer.default_billing_address_id || null,
      customer.default_shipping_address_id || null,
      customer.default_ship_via_id || null,
      customer.sales_tax_exempt ? 1 : 0,
      id
    );

    return this.getById(id);
  },

  /**
   * Delete a customer
   * @param {number} id - Customer ID
   * @returns {boolean} Success status
   */
  delete(id) {
    // Get the party ID before deletion to remove the party type
    const customer = this.getById(id);
    if (!customer) return false;

    const stmt = db.prepare(`
      DELETE FROM customers WHERE id = ?
    `);
    const result = stmt.run(id);
    
    // Remove customer from party_type_mappings
    if (result.changes > 0) {
      this.removeCustomerType(customer.party_id);
    }
    
    return result.changes > 0;
  },

  /**
   * Get a customer with complete address information
   * @param {number} id - Customer ID
   * @returns {Object} Customer with address info
   */
  getCustomerWithAddresses(id) {
    const customer = this.getById(id);
    if (!customer) return null;

    // Get billing address
    const billingAddressStmt = db.prepare(`
      SELECT a.*, st.name as tax_name, st.tax_rate
      FROM addresses a
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      WHERE a.id = ?
    `);
    const billingAddress = customer.default_billing_address_id 
      ? billingAddressStmt.get(customer.default_billing_address_id)
      : null;

    // Get shipping address
    const shippingAddressStmt = db.prepare(`
      SELECT a.*, st.name as tax_name, st.tax_rate
      FROM addresses a
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      WHERE a.id = ?
    `);
    const shippingAddress = customer.default_shipping_address_id 
      ? shippingAddressStmt.get(customer.default_shipping_address_id)
      : null;

    // Get all customer addresses
    const allAddressesStmt = db.prepare(`
      SELECT a.*, pa.address_type, pa.is_default, st.name as tax_name, st.tax_rate
      FROM addresses a
      JOIN party_addresses pa ON a.id = pa.address_id
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      WHERE pa.party_id = ?
    `);
    const allAddresses = allAddressesStmt.all(customer.party_id);

    // Get default shipping method
    const shipViaStmt = db.prepare(`
      SELECT * FROM ship_via WHERE id = ?
    `);
    const defaultShipVia = customer.default_ship_via_id
      ? shipViaStmt.get(customer.default_ship_via_id)
      : null;

    return {
      ...customer,
      billingAddress,
      shippingAddress,
      allAddresses,
      defaultShipVia
    };
  },

  /**
   * Add customer type to a party
   * @private
   * @param {number} partyId - Party ID
   */
  addCustomerType(partyId) {
    // First, get the customer party type ID
    const getTypeStmt = db.prepare(`
      SELECT id FROM party_types WHERE name = 'customer'
    `);
    
    let typeId = getTypeStmt.get()?.id;
    
    // If customer type doesn't exist, create it
    if (!typeId) {
      const createTypeStmt = db.prepare(`
        INSERT INTO party_types (name, description)
        VALUES ('customer', 'Customer party type')
      `);
      const result = createTypeStmt.run();
      typeId = result.lastInsertRowid;
    }
    
    // Add the mapping if it doesn't exist
    const checkMappingStmt = db.prepare(`
      SELECT id FROM party_type_mappings 
      WHERE party_id = ? AND party_type_id = ?
    `);
    
    const existingMapping = checkMappingStmt.get(partyId, typeId);
    
    if (!existingMapping) {
      const addMappingStmt = db.prepare(`
        INSERT INTO party_type_mappings (party_id, party_type_id)
        VALUES (?, ?)
      `);
      addMappingStmt.run(partyId, typeId);
    }
  },

  /**
   * Remove customer type from a party
   * @private
   * @param {number} partyId - Party ID
   */
  removeCustomerType(partyId) {
    // Get the customer party type ID
    const getTypeStmt = db.prepare(`
      SELECT id FROM party_types WHERE name = 'customer'
    `);
    
    const typeId = getTypeStmt.get()?.id;
    if (!typeId) return;
    
    // Remove the mapping
    const removeMappingStmt = db.prepare(`
      DELETE FROM party_type_mappings 
      WHERE party_id = ? AND party_type_id = ?
    `);
    
    removeMappingStmt.run(partyId, typeId);
  }
};

module.exports = CustomerModel;