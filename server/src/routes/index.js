const express = require('express');
const router = express.Router();
const ticketRoutes = require('./tickets');
const partyRoutes = require('./parties');
const customerRoutes = require('./customers');
const addressRoutes = require('./addresses');
const speciesRoutes = require('./species');
const salesTaxRoutes = require('./sales_tax');
const shipViaRoutes = require('./ship_via');

// API routes
router.use('/tickets', ticketRoutes);
router.use('/parties', partyRoutes);
router.use('/customers', customerRoutes);
router.use('/addresses', addressRoutes);
router.use('/species', speciesRoutes);
router.use('/sales-tax', salesTaxRoutes);
router.use('/ship-via', shipViaRoutes);

// Root route for API health check
router.get('/', (req, res) => {
  res.json({
    status: 'API is running',
    message: 'Welcome to the Lumber Sales API',
    version: '1.0.0'
  });
});

module.exports = router;