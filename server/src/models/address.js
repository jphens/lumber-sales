const db = require('../database');

const AddressModel = {
  /**
   * Get all addresses
   * @returns {Array} Array of address objects
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT a.*, st.name as tax_name, st.tax_rate 
      FROM addresses a
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      ORDER BY a.id DESC
    `);
    return stmt.all();
  },

  /**
   * Get address by ID
   * @param {number} id - Address ID
   * @returns {Object|null} Address object
   */
  getById(id) {
    const stmt = db.prepare(`
      SELECT a.*, st.name as tax_name, st.tax_rate, st.county as tax_county, st.state as tax_state
      FROM addresses a
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      WHERE a.id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get addresses for a party
   * @param {number} partyId - Party ID
   * @returns {Array} Array of address objects with address_type
   */
  getForParty(partyId) {
    const stmt = db.prepare(`
      SELECT a.*, pa.address_type, pa.is_default, 
             st.name as tax_name, st.tax_rate, st.county as tax_county, st.state as tax_state
      FROM addresses a
      JOIN party_addresses pa ON a.id = pa.address_id
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      WHERE pa.party_id = ?
      ORDER BY pa.is_default DESC, a.address_line1
    `);
    return stmt.all(partyId);
  },

  /**
   * Get default address for a party by type
   * @param {number} partyId - Party ID
   * @param {string} addressType - Address type ('billing', 'shipping', 'both')
   * @returns {Object|null} Address object
   */
  getDefaultForParty(partyId, addressType) {
    const stmt = db.prepare(`
      SELECT a.*, st.name as tax_name, st.tax_rate, st.county as tax_county, st.state as tax_state
      FROM addresses a
      JOIN party_addresses pa ON a.id = pa.address_id
      LEFT JOIN sales_tax st ON a.sales_tax_id = st.id
      WHERE pa.party_id = ? 
        AND pa.address_type IN (?, 'both')
        AND pa.is_default = 1
      LIMIT 1
    `);
    return stmt.get(partyId, addressType);
  },

  /**
   * Create a new address
   * @param {Object} address - Address object
   * @returns {Object} Created address
   */
  create(address) {
    const stmt = db.prepare(`
      INSERT INTO addresses (
        address_line1, address_line2, city, state, county, postal_code, country, sales_tax_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      address.address_line1,
      address.address_line2 || null,
      address.city,
      address.state,
      address.county || null,
      address.postal_code,
      address.country || 'USA',
      address.sales_tax_id || null
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update an address
   * @param {number} id - Address ID
   * @param {Object} address - Updated address data
   * @returns {Object} Updated address
   */
  update(id, address) {
    const stmt = db.prepare(`
      UPDATE addresses
      SET address_line1 = ?,
          address_line2 = ?,
          city = ?,
          state = ?,
          county = ?,
          postal_code = ?,
          country = ?,
          sales_tax_id = ?
      WHERE id = ?
    `);
    
    stmt.run(
      address.address_line1,
      address.address_line2 || null,
      address.city,
      address.state,
      address.county || null,
      address.postal_code,
      address.country || 'USA',
      address.sales_tax_id || null,
      id
    );

    return this.getById(id);
  },

  /**
   * Delete an address
   * @param {number} id - Address ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stmt = db.prepare(`
      DELETE FROM addresses WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  },

  /**
   * Associate an address with a party
   * @param {number} partyId - Party ID
   * @param {number} addressId - Address ID
   * @param {string} addressType - Address type ('billing', 'shipping', 'both')
   * @param {boolean} isDefault - Whether this is the default address
   * @returns {Object} The mapping ID
   */
  associateWithParty(partyId, addressId, addressType, isDefault = false) {
    // If setting as default, unset any existing defaults of this type
    if (isDefault) {
      const unsetDefaultStmt = db.prepare(`
        UPDATE party_addresses
        SET is_default = 0
        WHERE party_id = ? 
          AND address_type IN (?, 'both')
          AND is_default = 1
      `);
      unsetDefaultStmt.run(partyId, addressType);
    }

    // Create the association
    const stmt = db.prepare(`
      INSERT INTO party_addresses (
        party_id, address_id, address_type, is_default
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(party_id, address_id, address_type) 
      DO UPDATE SET is_default = ?
    `);
    
    const result = stmt.run(
      partyId,
      addressId,
      addressType,
      isDefault ? 1 : 0,
      isDefault ? 1 : 0
    );

    return { id: result.lastInsertRowid };
  },

  /**
   * Remove association between a party and an address
   * @param {number} partyId - Party ID
   * @param {number} addressId - Address ID
   * @param {string} [addressType] - Optional address type to remove specific type
   * @returns {boolean} Success status
   */
  removeAssociation(partyId, addressId, addressType = null) {
    let stmt;
    let params;
    
    if (addressType) {
      stmt = db.prepare(`
        DELETE FROM party_addresses 
        WHERE party_id = ? AND address_id = ? AND address_type = ?
      `);
      params = [partyId, addressId, addressType];
    } else {
      stmt = db.prepare(`
        DELETE FROM party_addresses 
        WHERE party_id = ? AND address_id = ?
      `);
      params = [partyId, addressId];
    }
    
    const result = stmt.run(...params);
    return result.changes > 0;
  },

  /**
   * Format address as a single line
   * @param {Object} address - Address object
   * @returns {string} Formatted address
   */
  formatSingleLine(address) {
    if (!address) return '';
    
    const parts = [
      address.address_line1,
      address.address_line2,
      address.county ? `${address.city}, ${address.county}, ${address.state} ${address.postal_code}` :
                       `${address.city}, ${address.state} ${address.postal_code}`,
      address.country !== 'USA' ? address.country : null
    ].filter(Boolean);
    
    return parts.join(', ');
  },

  /**
   * Format address as multiple lines
   * @param {Object} address - Address object
   * @returns {string[]} Array of address lines
   */
  formatMultiLine(address) {
    if (!address) return [];
    
    const lines = [
      address.address_line1,
      address.address_line2,
      address.county ? `${address.city}, ${address.county}, ${address.state} ${address.postal_code}` :
                       `${address.city}, ${address.state} ${address.postal_code}`,
      address.country !== 'USA' ? address.country : null
    ].filter(Boolean);
    
    return lines;
  }
};

module.exports = AddressModel;