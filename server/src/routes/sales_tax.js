const express = require('express');
const router = express.Router();
const SalesTaxController = require('../controllers/sales_tax');

// Get all sales tax rates
router.get('/', SalesTaxController.getAllSalesTax);

// Get a sales tax rate by ID
router.get('/:id', SalesTaxController.getSalesTaxById);

// Get a sales tax rate by location
router.get('/location/:county/:state', SalesTaxController.getSalesTaxByLocation);

// Create a new sales tax rate
router.post('/', SalesTaxController.createSalesTax);

// Update a sales tax rate
router.put('/:id', SalesTaxController.updateSalesTax);

// Delete a sales tax rate
router.delete('/:id', SalesTaxController.deleteSalesTax);

module.exports = router;