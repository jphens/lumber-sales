const db = require('../database');

const PartyModel = {
  /**
   * Get all parties
   * @returns {Array} Array of party objects
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT * FROM parties ORDER BY list_name ASC
    `);
    return stmt.all();
  },

  /**
   * Get party by ID
   * @param {number} id - Party ID
   * @returns {Object|null} Party object
   */
  getById(id) {
    const stmt = db.prepare(`
      SELECT * FROM parties WHERE id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get party by party_number
   * @param {string} partyNumber - Party number
   * @returns {Object|null} Party object
   */
  getByPartyNumber(partyNumber) {
    const stmt = db.prepare(`
    SELECT * FROM parties WHERE party_number = ?
  `);
    return stmt.get(partyNumber);
  },
  
  /**
   * Get parties by type
   * @param {string} type - Party type name (e.g., 'customer', 'vendor')
   * @returns {Array} Array of party objects
   */
  getByType(type) {
    const stmt = db.prepare(`
      SELECT p.* 
      FROM parties p
      JOIN party_type_mappings ptm ON p.id = ptm.party_id
      JOIN party_types pt ON ptm.party_type_id = pt.id
      WHERE pt.name = ?
      ORDER BY p.list_name ASC
    `);
    return stmt.all(type);
  },

  /**
   * Search parties by name or party_number
   * @param {string} searchTerm - Search term
   * @returns {Array} Array of party objects
   */
  search(searchTerm) {
    const stmt = db.prepare(`
      SELECT * FROM parties 
      WHERE list_name LIKE ?
      ORDER BY list_name ASC
      LIMIT 20
    `);
    return stmt.all(`%${searchTerm}%`);
  },

  /**
   * Create a new party
   * @param {Object} party - Party object
   * @returns {Object} Created party
   */
  create(party) {
    // Prepare the list_name
    const listName = `${party.party_number} - ${party.name}`;

    const stmt = db.prepare(`
      INSERT INTO parties (
        party_number, name, list_name, phone, email, notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      party.party_number,
      party.name,
      listName,
      party.phone || null,
      party.email || null,
      party.notes || null
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a party
   * @param {number} id - Party ID
   * @param {Object} party - Updated party data
   * @returns {Object} Updated party
   */
  update(id, party) {
    // Prepare the list_name
    const listName = `${party.party_number} - ${party.name}`;

    const stmt = db.prepare(`
      UPDATE parties
      SET party_number = ?,
          name = ?,
          list_name = ?,
          phone = ?,
          email = ?,
          notes = ?
      WHERE id = ?
    `);

    stmt.run(
      party.party_number,
      party.name,
      listName,
      party.phone || null,
      party.email || null,
      party.notes || null,
      id
    );

    return this.getById(id);
  },

  /**
   * Delete a party
   * @param {number} id - Party ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stmt = db.prepare(`
      DELETE FROM parties WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  },

  /**
   * Get a party with its addresses
   * @param {number} partyId - Party ID
   * @returns {Object} Party with addresses
   */
  getWithAddresses(partyId) {
    // Get the party
    const party = this.getById(partyId);
    if (!party) return null;

    // Get addresses
    const addressesStmt = db.prepare(`
      SELECT a.*, pa.address_type, pa.is_default
      FROM addresses a
      JOIN party_addresses pa ON a.id = pa.address_id
      WHERE pa.party_id = ?
    `);
    const addresses = addressesStmt.all(partyId);

    // Get types
    const typesStmt = db.prepare(`
      SELECT pt.* 
      FROM party_types pt
      JOIN party_type_mappings ptm ON pt.id = ptm.party_type_id
      WHERE ptm.party_id = ?
    `);
    const types = typesStmt.all(partyId);

    return {
      ...party,
      addresses,
      types,
    };
  },
};

module.exports = PartyModel;