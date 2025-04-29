const express = require('express');
const router = express.Router();
const PartyController = require('../controllers/parties');

// Get all parties
router.get('/', PartyController.getAllParties);

// Search parties
router.get('/search', PartyController.searchParties);

// Get parties by type
router.get('/type/:type', PartyController.getPartiesByType);

// Get a party by ID
router.get('/:id', PartyController.getPartyById);

// Get a party with addresses
router.get('/:id/addresses', PartyController.getPartyWithAddresses);

// Create a new party
router.post('/', PartyController.createParty);

// Update a party
router.put('/:id', PartyController.updateParty);

// Delete a party
router.delete('/:id', PartyController.deleteParty);

module.exports = router;