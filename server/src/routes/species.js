const express = require('express');
const router = express.Router();
const SpeciesController = require('../controllers/species');

// Get all species
router.get('/', SpeciesController.getAllSpecies);

// Search species
router.get('/search', SpeciesController.searchSpecies);

// Get a species by species number
router.get('/number/:number', SpeciesController.getSpeciesByNumber);

// Get a species by ID
router.get('/:id', SpeciesController.getSpeciesById);

// Create a new species
router.post('/', SpeciesController.createSpecies);

// Update a species
router.put('/:id', SpeciesController.updateSpecies);

// Delete a species
router.delete('/:id', SpeciesController.deleteSpecies);

module.exports = router;