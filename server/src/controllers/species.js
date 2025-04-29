const SpeciesModel = require('../models/species');

const SpeciesController = {
  /**
   * Get all species
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllSpecies(req, res) {
    try {
      const speciesList = SpeciesModel.getAll();
      res.json(speciesList);
    } catch (error) {
      console.error('Error getting species:', error);
      res.status(500).json({ error: 'Failed to retrieve species' });
    }
  },

  /**
   * Get a species by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSpeciesById(req, res) {
    try {
      const { id } = req.params;
      const species = SpeciesModel.getById(id);

      if (!species) {
        return res.status(404).json({ error: 'Species not found' });
      }

      res.json(species);
    } catch (error) {
      console.error(`Error getting species ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve species' });
    }
  },

  /**
   * Get a species by species number
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSpeciesByNumber(req, res) {
    try {
      const { number } = req.params;
      const species = SpeciesModel.getBySpeciesNumber(number);

      if (!species) {
        return res.status(404).json({ error: 'Species not found' });
      }

      res.json(species);
    } catch (error) {
      console.error(`Error getting species by number ${req.params.number}:`, error);
      res.status(500).json({ error: 'Failed to retrieve species' });
    }
  },

  /**
   * Search species
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  searchSpecies(req, res) {
    try {
      const { term } = req.query;
      
      if (!term || term.length < 2) {
        return res.json([]);
      }
      
      const speciesList = SpeciesModel.search(term);
      res.json(speciesList);
    } catch (error) {
      console.error(`Error searching species:`, error);
      res.status(500).json({ error: 'Failed to search species' });
    }
  },

  /**
   * Create a new species
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createSpecies(req, res) {
    try {
      const { species_number, name, description } = req.body;

      if (!species_number || !name) {
        return res.status(400).json({ error: 'Species number and name are required' });
      }

      // Check if species_number is already in use
      const existingSpecies = SpeciesModel.getBySpeciesNumber(species_number);
      if (existingSpecies) {
        return res.status(400).json({ error: 'Species number is already in use' });
      }

      const species = {
        species_number,
        name,
        description
      };

      const newSpecies = SpeciesModel.create(species);
      res.status(201).json(newSpecies);
    } catch (error) {
      console.error('Error creating species:', error);
      res.status(500).json({ error: 'Failed to create species' });
    }
  },

  /**
   * Update a species
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateSpecies(req, res) {
    try {
      const { id } = req.params;
      const { species_number, name, description } = req.body;

      if (!species_number || !name) {
        return res.status(400).json({ error: 'Species number and name are required' });
      }

      // Check if the species exists
      const existingSpecies = SpeciesModel.getById(id);
      if (!existingSpecies) {
        return res.status(404).json({ error: 'Species not found' });
      }

      // Check if species_number is already in use by another species
      if (species_number !== existingSpecies.species_number) {
        const speciesWithSameNumber = SpeciesModel.getBySpeciesNumber(species_number);
        if (speciesWithSameNumber && speciesWithSameNumber.id !== parseInt(id)) {
          return res.status(400).json({ error: 'Species number is already in use' });
        }
      }

      const species = {
        species_number,
        name,
        description
      };

      const updatedSpecies = SpeciesModel.update(id, species);
      res.json(updatedSpecies);
    } catch (error) {
      console.error(`Error updating species ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update species' });
    }
  },

  /**
   * Delete a species
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteSpecies(req, res) {
    try {
      const { id } = req.params;

      // Check if the species exists
      const existingSpecies = SpeciesModel.getById(id);
      if (!existingSpecies) {
        return res.status(404).json({ error: 'Species not found' });
      }

      // Delete the species
      const success = SpeciesModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete species' });
      }
    } catch (error) {
      console.error(`Error deleting species ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete species' });
    }
  }
};

module.exports = SpeciesController;