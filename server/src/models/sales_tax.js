const db = require('../database');

const SalesTaxModel = {
  /**
   * Get all sales tax rates
   * @returns {Array} Array of sales tax objects
   */
  getAll() {
    const stmt = db.prepare(`
      SELECT * FROM sales_tax ORDER BY state, county ASC
    `);
    return stmt.all();
  },

  /**
   * Get sales tax by ID
   * @param {number} id - Sales tax ID
   * @returns {Object|null} Sales tax object
   */
  getById(id) {
    const stmt = db.prepare(`
      SELECT * FROM sales_tax WHERE id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get sales tax by location
   * @param {string} county - County name
   * @param {string} state - State abbreviation
   * @returns {Object|null} Sales tax object
   */
  getByLocation(county, state) {
    const stmt = db.prepare(`
      SELECT * FROM sales_tax 
      WHERE county = ? AND state = ?
      ORDER BY effective_date DESC
      LIMIT 1
    `);
    return stmt.get(county, state);
  },

  /**
   * Create a new sales tax
   * @param {Object} salesTax - Sales tax object
   * @returns {Object} Created sales tax
   */
  create(salesTax) {
    const stmt = db.prepare(`
      INSERT INTO sales_tax (
        name, county, state, tax_rate, effective_date
      )
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      salesTax.name,
      salesTax.county,
      salesTax.state,
      salesTax.tax_rate,
      salesTax.effective_date
    );

    return this.getById(result.lastInsertRowid);
  },

  /**
   * Update a sales tax
   * @param {number} id - Sales tax ID
   * @param {Object} salesTax - Updated sales tax data
   * @returns {Object} Updated sales tax
   */
  update(id, salesTax) {
    const stmt = db.prepare(`
      UPDATE sales_tax
      SET name = ?,
          county = ?,
          state = ?,
          tax_rate = ?,
          effective_date = ?
      WHERE id = ?
    `);
    
    stmt.run(
      salesTax.name,
      salesTax.county,
      salesTax.state,
      salesTax.tax_rate,
      salesTax.effective_date,
      id
    );

    return this.getById(id);
  },

  /**
   * Delete a sales tax
   * @param {number} id - Sales tax ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const stmt = db.prepare(`
      DELETE FROM sales_tax WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = SalesTaxModel;