const express = require('express');
const router = express.Router();
const ticketRoutes = require('./tickets');
const partyRoutes = require('./parties');
const customerRoutes = require('./customers');
const addressRoutes = require('./addresses');
const speciesRoutes = require('./species');

// API routes
router.use('/tickets', ticketRoutes);
router.use('/parties', partyRoutes);
router.use('/customers', customerRoutes);
router.use('/addresses', addressRoutes);
router.use('/species', speciesRoutes);

// Root route for API health check
router.get('/', (req, res) => {
  res.json({
    status: 'API is running',
    message: 'Welcome to the Lumber Sales API',
    version: '1.0.0'
  });
});

module.exports = router;