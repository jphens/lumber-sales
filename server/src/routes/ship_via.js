const express = require('express');
const router = express.Router();
const ShipViaController = require('../controllers/ship_via');

// Get all shipping methods
router.get('/', ShipViaController.getAllShipVia);

// Get a shipping method by ID
router.get('/:id', ShipViaController.getShipViaById);

// Create a new shipping method
router.post('/', ShipViaController.createShipVia);

// Update a shipping method
router.put('/:id', ShipViaController.updateShipVia);

// Delete a shipping method
router.delete('/:id', ShipViaController.deleteShipVia);

module.exports = router;