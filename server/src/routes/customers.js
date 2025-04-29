const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customers');

// Get all customers
router.get('/', CustomerController.getAllCustomers);

// Get a customer by ID
router.get('/:id', CustomerController.getCustomerById);

// Get a customer with addresses
router.get('/:id/addresses', CustomerController.getCustomerWithAddresses);

// Get a customer by party ID
router.get('/party/:partyId', CustomerController.getCustomerByPartyId);

// Create a new customer
router.post('/', CustomerController.createCustomer);

// Update a customer
router.put('/:id', CustomerController.updateCustomer);

// Delete a customer
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router;