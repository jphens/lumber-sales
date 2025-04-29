const PartyModel = require('../models/party');

const PartyController = {
  /**
   * Get all parties
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllParties(req, res) {
    try {
      const parties = PartyModel.getAll();
      res.json(parties);
    } catch (error) {
      console.error('Error getting parties:', error);
      res.status(500).json({ error: 'Failed to retrieve parties' });
    }
  },

  /**
   * Get a party by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPartyById(req, res) {
    try {
      const { id } = req.params;
      const party = PartyModel.getById(id);

      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }

      res.json(party);
    } catch (error) {
      console.error(`Error getting party ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve party' });
    }
  },

  /**
   * Get a party with its addresses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPartyWithAddresses(req, res) {
    try {
      const { id } = req.params;
      const party = PartyModel.getWithAddresses(id);

      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }

      res.json(party);
    } catch (error) {
      console.error(`Error getting party with addresses ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve party with addresses' });
    }
  },

  /**
   * Get parties by type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPartiesByType(req, res) {
    try {
      const { type } = req.params;
      const parties = PartyModel.getByType(type);
      res.json(parties);
    } catch (error) {
      console.error(`Error getting parties by type ${req.params.type}:`, error);
      res.status(500).json({ error: 'Failed to retrieve parties' });
    }
  },

  /**
   * Search parties
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  searchParties(req, res) {
    try {
      const { term } = req.query;
      
      if (!term || term.length < 2) {
        return res.json([]);
      }
      
      const parties = PartyModel.search(term);
      res.json(parties);
    } catch (error) {
      console.error(`Error searching parties:`, error);
      res.status(500).json({ error: 'Failed to search parties' });
    }
  },

  /**
   * Create a new party
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createParty(req, res) {
    try {
      const { party_number, name, phone, email, notes } = req.body;

      if (!party_number || !name) {
        return res.status(400).json({ error: 'Party number and name are required' });
      }

      // Check if party_number is already in use
      const existingParty = PartyModel.getByPartyNumber(party_number);
      if (existingParty) {
        return res.status(400).json({ error: 'Party number is already in use' });
      }

      const party = {
        party_number,
        name,
        phone,
        email,
        notes
      };

      const newParty = PartyModel.create(party);
      res.status(201).json(newParty);
    } catch (error) {
      console.error('Error creating party:', error);
      res.status(500).json({ error: 'Failed to create party' });
    }
  },

  /**
   * Update a party
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateParty(req, res) {
    try {
      const { id } = req.params;
      const { party_number, name, phone, email, notes } = req.body;

      if (!party_number || !name) {
        return res.status(400).json({ error: 'Party number and name are required' });
      }

      // Check if the party exists
      const existingParty = PartyModel.getById(id);
      if (!existingParty) {
        return res.status(404).json({ error: 'Party not found' });
      }

      // Check if party_number is already in use by another party
      if (party_number !== existingParty.party_number) {
        const partyWithSameNumber = PartyModel.getByPartyNumber(party_number);
        if (partyWithSameNumber && partyWithSameNumber.id !== parseInt(id)) {
          return res.status(400).json({ error: 'Party number is already in use' });
        }
      }

      const party = {
        party_number,
        name,
        phone,
        email,
        notes
      };

      const updatedParty = PartyModel.update(id, party);
      res.json(updatedParty);
    } catch (error) {
      console.error(`Error updating party ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update party' });
    }
  },

  /**
   * Delete a party
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteParty(req, res) {
    try {
      const { id } = req.params;

      // Check if the party exists
      const existingParty = PartyModel.getById(id);
      if (!existingParty) {
        return res.status(404).json({ error: 'Party not found' });
      }

      // Delete the party
      const success = PartyModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete party' });
      }
    } catch (error) {
      console.error(`Error deleting party ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete party' });
    }
  }
};

module.exports = PartyController;