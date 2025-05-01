const SalesTaxModel = require('../models/sales_tax');

const SalesTaxController = {
  /**
   * Get all sales tax rates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllSalesTax(req, res) {
    try {
      const salesTaxRates = SalesTaxModel.getAll();
      res.json(salesTaxRates);
    } catch (error) {
      console.error('Error getting sales tax rates:', error);
      res.status(500).json({ error: 'Failed to retrieve sales tax rates' });
    }
  },

  /**
   * Get a sales tax by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSalesTaxById(req, res) {
    try {
      const { id } = req.params;
      const salesTax = SalesTaxModel.getById(id);

      if (!salesTax) {
        return res.status(404).json({ error: 'Sales tax not found' });
      }

      res.json(salesTax);
    } catch (error) {
      console.error(`Error getting sales tax ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve sales tax' });
    }
  },

  /**
   * Get a sales tax by location
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSalesTaxByLocation(req, res) {
    try {
      const { county, state } = req.params;
      
      if (!county || !state) {
        return res.status(400).json({ error: 'County and state are required' });
      }
      
      const salesTax = SalesTaxModel.getByLocation(county, state);

      if (!salesTax) {
        return res.status(404).json({ error: 'Sales tax not found for this location' });
      }

      res.json(salesTax);
    } catch (error) {
      console.error(`Error getting sales tax by location:`, error);
      res.status(500).json({ error: 'Failed to retrieve sales tax' });
    }
  },

  /**
   * Create a new sales tax
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createSalesTax(req, res) {
    try {
      const { name, county, state, tax_rate, effective_date } = req.body;

      if (!name || !county || !state || tax_rate === undefined || !effective_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const salesTax = {
        name,
        county,
        state,
        tax_rate: parseFloat(tax_rate),
        effective_date
      };

      const newSalesTax = SalesTaxModel.create(salesTax);
      res.status(201).json(newSalesTax);
    } catch (error) {
      console.error('Error creating sales tax:', error);
      res.status(500).json({ error: 'Failed to create sales tax' });
    }
  },

  /**
   * Update a sales tax
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateSalesTax(req, res) {
    try {
      const { id } = req.params;
      const { name, county, state, tax_rate, effective_date } = req.body;

      // Check if sales tax exists
      const existingSalesTax = SalesTaxModel.getById(id);
      if (!existingSalesTax) {
        return res.status(404).json({ error: 'Sales tax not found' });
      }

      if (!name || !county || !state || tax_rate === undefined || !effective_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const salesTax = {
        name,
        county,
        state,
        tax_rate: parseFloat(tax_rate),
        effective_date
      };

      const updatedSalesTax = SalesTaxModel.update(id, salesTax);
      res.json(updatedSalesTax);
    } catch (error) {
      console.error(`Error updating sales tax ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update sales tax' });
    }
  },

  /**
   * Delete a sales tax
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteSalesTax(req, res) {
    try {
      const { id } = req.params;

      // Check if sales tax exists
      const existingSalesTax = SalesTaxModel.getById(id);
      if (!existingSalesTax) {
        return res.status(404).json({ error: 'Sales tax not found' });
      }

      // Delete the sales tax
      const success = SalesTaxModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete sales tax' });
      }
    } catch (error) {
      console.error(`Error deleting sales tax ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete sales tax' });
    }
  }
};

module.exports = SalesTaxController;