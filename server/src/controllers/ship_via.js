const ShipViaModel = require('../models/ship_via');

const ShipViaController = {
  /**
   * Get all shipping methods
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllShipVia(req, res) {
    try {
      const shipViaMethods = ShipViaModel.getAll();
      res.json(shipViaMethods);
    } catch (error) {
      console.error('Error getting shipping methods:', error);
      res.status(500).json({ error: 'Failed to retrieve shipping methods' });
    }
  },

  /**
   * Get a shipping method by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getShipViaById(req, res) {
    try {
      const { id } = req.params;
      const shipVia = ShipViaModel.getById(id);

      if (!shipVia) {
        return res.status(404).json({ error: 'Shipping method not found' });
      }

      res.json(shipVia);
    } catch (error) {
      console.error(`Error getting shipping method ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve shipping method' });
    }
  },

  /**
   * Create a new shipping method
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createShipVia(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Check if shipping method with the same name already exists
      const existingShipVia = ShipViaModel.getByName(name);
      if (existingShipVia) {
        return res.status(400).json({ error: 'Shipping method with this name already exists' });
      }

      const shipVia = {
        name,
        description
      };

      const newShipVia = ShipViaModel.create(shipVia);
      res.status(201).json(newShipVia);
    } catch (error) {
      console.error('Error creating shipping method:', error);
      res.status(500).json({ error: 'Failed to create shipping method' });
    }
  },

  /**
   * Update a shipping method
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateShipVia(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Check if shipping method exists
      const existingShipVia = ShipViaModel.getById(id);
      if (!existingShipVia) {
        return res.status(404).json({ error: 'Shipping method not found' });
      }

      // Check if another shipping method with the same name exists
      if (name !== existingShipVia.name) {
        const shipViaWithSameName = ShipViaModel.getByName(name);
        if (shipViaWithSameName && shipViaWithSameName.id !== parseInt(id)) {
          return res.status(400).json({ error: 'Another shipping method with this name already exists' });
        }
      }

      const shipVia = {
        name,
        description
      };

      const updatedShipVia = ShipViaModel.update(id, shipVia);
      res.json(updatedShipVia);
    } catch (error) {
      console.error(`Error updating shipping method ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update shipping method' });
    }
  },

  /**
   * Delete a shipping method
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteShipVia(req, res) {
    try {
      const { id } = req.params;

      // Check if shipping method exists
      const existingShipVia = ShipViaModel.getById(id);
      if (!existingShipVia) {
        return res.status(404).json({ error: 'Shipping method not found' });
      }

      // Delete the shipping method
      const success = ShipViaModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete shipping method' });
      }
    } catch (error) {
      console.error(`Error deleting shipping method ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete shipping method' });
    }
  }
};

module.exports = ShipViaController;