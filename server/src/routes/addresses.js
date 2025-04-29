const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/addresses');

// Get all addresses
router.get('/', AddressController.getAllAddresses);

// Get an address by ID
router.get('/:id', AddressController.getAddressById);

// Get addresses for a party
router.get('/party/:partyId', AddressController.getAddressesForParty);

// Get default address for a party by type
router.get('/party/:partyId/default/:type', AddressController.getDefaultAddressForParty);

// Create a new address
router.post('/', AddressController.createAddress);

// Update an address
router.put('/:id', AddressController.updateAddress);

// Delete an address
router.delete('/:id', AddressController.deleteAddress);

// Associate an address with a party
router.post('/party/:partyId/address/:addressId', AddressController.associateWithParty);

// Remove association between address and party
router.delete('/party/:partyId/address/:addressId', AddressController.removeAssociation);

module.exports = router;