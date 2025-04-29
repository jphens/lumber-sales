const db = require('../database');

const SpeciesModel = {
  /**
   * Get all species
   * @returns {Array} Array of species objects
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT * FROM species ORDER BY list_name ASC
    `);
    return stmt.all();
  },

  /**
   * Get species by ID
   * @param {number} id - Species ID
   * @returns {Object|null} Species object
   */
  getById(id) {
    const stmt = db.prepare(`
      SELECT * FROM species WHERE id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get species by species_number
   * @param {string} speciesNumber - Species number
   * @returns {Object|null} Species object
   */
  getBySpeciesNumber(speciesNumber) {
    const stmt = db.prepare(`
      SELECT * FROM species WHERE species_number = ?
    `);
    return stmt.get(speciesNumber);
  },

  /**
   * Search species by name or species_number
   * @param {string} searchTerm - Search term
   * @returns {Array} Array of species objects
   */
  search(searchTerm) {
    const stmt = db.prepare(`
      SELECT * FROM species 
      WHERE list_name LIKE ? OR name LIKE ?
      ORDER BY list_name ASC
      LIMIT 20
    `);
    return stmt.all(`%${searchTerm}%`, `%${searchTerm}%`);
  },

  /**
   * Create a new species
   * @param {Object} species - Species object
   * @returns {Object} Created species
   */
  create(species) {
    // Prepare the list_name
    const listName = `${species.species_number} - ${species.name}`;

    const stmt = db.prepare(`
      INSERT INTO species (
        species_number, name, list_name, description
      )
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      species.species_number,
      species.name,
      listName,
      species.description || null
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a species
   * @param {number} id - Species ID
   * @param {Object} species - Updated species data
   * @returns {Object} Updated species
   */
  update(id, species) {
    // Prepare the list_name
    const listName = `${species.species_number} - ${species.name}`;

    const stmt = db.prepare(`
      UPDATE species
      SET species_number = ?,
          name = ?,
          list_name = ?,
          description = ?
      WHERE id = ?
    `);
    
    stmt.run(
      species.species_number,
      species.name,
      listName,
      species.description || null,
      id
    );

    return this.getById(id);
  },

  /**
   * Delete a species
   * @param {number} id - Species ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stmt = db.prepare(`
      DELETE FROM species WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = SpeciesModel;