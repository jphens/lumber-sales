const db = require('../database');

const ShipViaModel = {
  /**
   * Get all shipping methods
   * @returns {Array} Array of shipping method objects
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT * FROM ship_via ORDER BY name ASC
    `);
    return stmt.all();
  },

  /**
   * Get shipping method by ID
   * @param {number} id - Shipping method ID
   * @returns {Object|null} Shipping method object
   */
  getById(id) {
    const stmt = db.prepare(`
      SELECT * FROM ship_via WHERE id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get shipping method by name
   * @param {string} name - Shipping method name
   * @returns {Object|null} Shipping method object
   */
  getByName(name) {
    const stmt = db.prepare(`
      SELECT * FROM ship_via WHERE name = ?
    `);
    return stmt.get(name);
  },

  /**
   * Create a new shipping method
   * @param {Object} shipVia - Shipping method object
   * @returns {Object} Created shipping method
   */
  create(shipVia) {
    const stmt = db.prepare(`
      INSERT INTO ship_via (
        name, description
      )
      VALUES (?, ?)
    `);
    
    const result = stmt.run(
      shipVia.name,
      shipVia.description || null
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a shipping method
   * @param {number} id - Shipping method ID
   * @param {Object} shipVia - Updated shipping method data
   * @returns {Object} Updated shipping method
   */
  update(id, shipVia) {
    const stmt = db.prepare(`
      UPDATE ship_via
      SET name = ?,
          description = ?
      WHERE id = ?
    `);
    
    stmt.run(
      shipVia.name,
      shipVia.description || null,
      id
    );

    return this.getById(id);
  },

  /**
   * Delete a shipping method
   * @param {number} id - Shipping method ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stmt = db.prepare(`
      DELETE FROM ship_via WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = ShipViaModel;