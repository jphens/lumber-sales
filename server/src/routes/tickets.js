const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/tickets');

// Get all tickets
router.get('/', TicketController.getAllTickets);

// Get a ticket by ID
router.get('/:id', TicketController.getTicketById);

// Create a new ticket
router.post('/', TicketController.createTicket);

// Update a ticket
router.put('/:id', TicketController.updateTicket);

// Delete a ticket
router.delete('/:id', TicketController.deleteTicket);

module.exports = router;