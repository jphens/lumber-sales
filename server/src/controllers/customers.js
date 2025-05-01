const CustomerModel = require('../models/customer');
const PartyModel = require('../models/party');
const ShipViaModel = require('../models/ship_via');

const CustomerController = {
  /**
   * Get all customers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllCustomers(req, res) {
    try {
      const customers = CustomerModel.getAll();
      res.json(customers);
    } catch (error) {
      console.error('Error getting customers:', error);
      res.status(500).json({ error: 'Failed to retrieve customers' });
    }
  },

  /**
   * Get a customer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const customer = CustomerModel.getById(id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      console.error(`Error getting customer ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve customer' });
    }
  },

  /**
   * Get a customer with addresses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCustomerWithAddresses(req, res) {
    try {
      const { id } = req.params;
      const customer = CustomerModel.getCustomerWithAddresses(id);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      console.error(`Error getting customer with addresses ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve customer with addresses' });
    }
  },

  /**
   * Get a customer by party ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCustomerByPartyId(req, res) {
    try {
      const { partyId } = req.params;
      const customer = CustomerModel.getByPartyId(partyId);

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      console.error(`Error getting customer by party ID ${req.params.partyId}:`, error);
      res.status(500).json({ error: 'Failed to retrieve customer' });
    }
  },

  /**
   * Create a new customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createCustomer(req, res) {
    try {
      const { 
        party_id, 
        default_billing_address_id, 
        default_shipping_address_id,
        default_ship_via_id,
        sales_tax_exempt
      } = req.body;

      if (!party_id) {
        return res.status(400).json({ error: 'Party ID is required' });
      }

      // Check if the party exists
      const existingParty = PartyModel.getById(party_id);
      if (!existingParty) {
        return res.status(404).json({ error: 'Party not found' });
      }

      // Check if the party is already a customer
      const existingCustomer = CustomerModel.getByPartyId(party_id);
      if (existingCustomer) {
        return res.status(400).json({ error: 'This party is already a customer' });
      }

      // Check if ship_via_id is valid if provided
      if (default_ship_via_id) {
        const shipVia = ShipViaModel.getById(default_ship_via_id);
        if (!shipVia) {
          return res.status(404).json({ error: 'Shipping method not found' });
        }
      }

      const customer = {
        party_id,
        default_billing_address_id,
        default_shipping_address_id,
        default_ship_via_id,
        sales_tax_exempt: sales_tax_exempt === true
      };

      const newCustomer = CustomerModel.create(customer);
      res.status(201).json(newCustomer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  },

  /**
   * Update a customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const { 
        default_billing_address_id, 
        default_shipping_address_id,
        default_ship_via_id,
        sales_tax_exempt
      } = req.body;

      // Check if the customer exists
      const existingCustomer = CustomerModel.getById(id);
      if (!existingCustomer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if ship_via_id is valid if provided
      if (default_ship_via_id) {
        const shipVia = ShipViaModel.getById(default_ship_via_id);
        if (!shipVia) {
          return res.status(404).json({ error: 'Shipping method not found' });
        }
      }

      const customer = {
        default_billing_address_id,
        default_shipping_address_id,
        default_ship_via_id,
        sales_tax_exempt: sales_tax_exempt === true
      };

      const updatedCustomer = CustomerModel.update(id, customer);
      res.json(updatedCustomer);
    } catch (error) {
      console.error(`Error updating customer ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  },

  /**
   * Delete a customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteCustomer(req, res) {
    try {
      const { id } = req.params;

      // Check if the customer exists
      const existingCustomer = CustomerModel.getById(id);
      if (!existingCustomer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Delete the customer
      const success = CustomerModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete customer' });
      }
    } catch (error) {
      console.error(`Error deleting customer ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }
};

module.exports = CustomerController;