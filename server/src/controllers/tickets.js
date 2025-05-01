const TicketModel = require('../models/ticket');
const PartyModel = require('../models/party');
const CustomerModel = require('../models/customer');
const AddressModel = require('../models/address');
const SpeciesModel = require('../models/species');
const ShipViaModel = require('../models/ship_via');
const SalesTaxModel = require('../models/sales_tax');

const TicketController = {
  /**
   * Get all tickets
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllTickets(req, res) {
    try {
      const tickets = TicketModel.getAll();
      res.json(tickets);
    } catch (error) {
      console.error('Error getting tickets:', error);
      res.status(500).json({ error: 'Failed to retrieve tickets' });
    }
  },

  /**
   * Get a ticket by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = TicketModel.getById(id);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error(`Error getting ticket ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve ticket' });
    }
  },

  /**
   * Create a new ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createTicket(req, res) {
    try {
      console.log('Received ticket data:', req.body);
      const { 
        id, 
        party_id, 
        billing_address_id, 
        shipping_address_id,
        ship_via_id,
        sales_tax_id,
        customerName, 
        customerPhone, 
        date, 
        status,
        total_bf,
        total_tax,
        total_amount, 
        items 
      } = req.body;

      if (!id || !customerName || !date || !items || !Array.isArray(items)) {
        console.log('Validation failed, missing required fields:', {
          hasId: !!id,
          hasCustomerName: !!customerName,
          hasDate: !!date,
          hasItems: !!items,
          isItemsArray: Array.isArray(items)
        });
        return res.status(400).json({ error: 'Missing required ticket information' });
      }

      // Check if party exists if party_id is provided
      if (party_id) {
        const party = PartyModel.getById(party_id);
        if (!party) {
          return res.status(404).json({ error: 'Party not found' });
        }
      }

      // Check if ship_via exists if ship_via_id is provided
      if (ship_via_id) {
        const shipVia = ShipViaModel.getById(ship_via_id);
        if (!shipVia) {
          return res.status(404).json({ error: 'Shipping method not found' });
        }
      }

      // Check if sales_tax exists if sales_tax_id is provided
      if (sales_tax_id) {
        const salesTax = SalesTaxModel.getById(sales_tax_id);
        if (!salesTax) {
          return res.status(404).json({ error: 'Sales tax not found' });
        }
      }

      // Validate each item has the required fields
      for (const item of items) {
        if (!item.quantity || !item.width || !item.thickness || !item.length || !item.price_per_mbf) {
          return res.status(400).json({ 
            error: 'Each item must include quantity, width, thickness, length, and price_per_mbf' 
          });
        }

        // Check if species exists if species_id is provided and not empty
        if (item.species_id && item.species_id !== '') {
          const species = SpeciesModel.getById(item.species_id);
          if (!species) {
            return res.status(404).json({ 
              error: `Species with ID ${item.species_id} not found` 
            });
          }
        }
      }

      // Create the ticket
      const ticket = {
        id,
        party_id: party_id || null,
        billing_address_id: billing_address_id || null,
        shipping_address_id: shipping_address_id || null,
        ship_via_id: ship_via_id || null,
        sales_tax_id: sales_tax_id || null,
        customerName,
        customerPhone: customerPhone || '',
        date,
        status: status || 'draft',
        total_bf: parseFloat(total_bf) || 0,
        total_tax: parseFloat(total_tax) || 0,
        total_amount: parseFloat(total_amount) || 0
      };

      const newTicket = TicketModel.create(ticket, items);
      res.status(201).json(newTicket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  },

  /**
   * Update a ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateTicket(req, res) {
    try {
      const { id } = req.params;
      const { 
        party_id, 
        billing_address_id, 
        shipping_address_id,
        ship_via_id,
        sales_tax_id,
        customerName, 
        customerPhone, 
        date, 
        status,
        total_bf,
        total_tax,
        total_amount, 
        items 
      } = req.body;

      if (!customerName || !date || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Missing required ticket information' });
      }

      // Check if ticket exists
      const existingTicket = TicketModel.getById(id);
      if (!existingTicket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Check if party exists if party_id is provided
      if (party_id) {
        const party = PartyModel.getById(party_id);
        if (!party) {
          return res.status(404).json({ error: 'Party not found' });
        }
      }

      // Check if ship_via exists if ship_via_id is provided
      if (ship_via_id) {
        const shipVia = ShipViaModel.getById(ship_via_id);
        if (!shipVia) {
          return res.status(404).json({ error: 'Shipping method not found' });
        }
      }

      // Check if sales_tax exists if sales_tax_id is provided
      if (sales_tax_id) {
        const salesTax = SalesTaxModel.getById(sales_tax_id);
        if (!salesTax) {
          return res.status(404).json({ error: 'Sales tax not found' });
        }
      }

      // Validate each item has the required fields
      for (const item of items) {
        if (!item.quantity || !item.width || !item.thickness || !item.length || !item.price_per_mbf) {
          return res.status(400).json({ 
            error: 'Each item must include quantity, width, thickness, length, and price_per_mbf' 
          });
        }

        // Check if species exists if species_id is provided
        if (item.species_id) {
          const species = SpeciesModel.getById(item.species_id);
          if (!species) {
            return res.status(404).json({ 
              error: `Species with ID ${item.species_id} not found` 
            });
          }
        }
      }

      // Update the ticket
      const ticket = {
        party_id: party_id || null,
        billing_address_id: billing_address_id || null,
        shipping_address_id: shipping_address_id || null,
        ship_via_id: ship_via_id || null,
        sales_tax_id: sales_tax_id || null,
        customerName,
        customerPhone: customerPhone || '',
        date,
        status: status || 'draft',
        total_bf: parseFloat(total_bf) || 0,
        total_tax: parseFloat(total_tax) || 0,
        total_amount: parseFloat(total_amount) || 0
      };

      const updatedTicket = TicketModel.update(id, ticket, items);
      res.json(updatedTicket);
    } catch (error) {
      console.error(`Error updating ticket ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  },

  /**
   * Delete a ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteTicket(req, res) {
    try {
      const { id } = req.params;

      // Check if ticket exists
      const existingTicket = TicketModel.getById(id);
      if (!existingTicket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Delete the ticket
      const success = TicketModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete ticket' });
      }
    } catch (error) {
      console.error(`Error deleting ticket ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete ticket' });
    }
  }
};

module.exports = TicketController;