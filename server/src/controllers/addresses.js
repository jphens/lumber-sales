const AddressModel = require('../models/address');
const PartyModel = require('../models/party');
const SalesTaxModel = require('../models/sales_tax');

const AddressController = {
  /**
   * Get all addresses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllAddresses(req, res) {
    try {
      const addresses = AddressModel.getAll();
      res.json(addresses);
    } catch (error) {
      console.error('Error getting addresses:', error);
      res.status(500).json({ error: 'Failed to retrieve addresses' });
    }
  },

  /**
   * Get an address by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAddressById(req, res) {
    try {
      const { id } = req.params;
      const address = AddressModel.getById(id);

      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }

      res.json(address);
    } catch (error) {
      console.error(`Error getting address ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve address' });
    }
  },

  /**
   * Get addresses for a party
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAddressesForParty(req, res) {
    try {
      const { partyId } = req.params;
      
      // Check if party exists
      const party = PartyModel.getById(partyId);
      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }
      
      const addresses = AddressModel.getForParty(partyId);
      res.json(addresses);
    } catch (error) {
      console.error(`Error getting addresses for party ${req.params.partyId}:`, error);
      res.status(500).json({ error: 'Failed to retrieve addresses' });
    }
  },

  /**
   * Get default address for a party by type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDefaultAddressForParty(req, res) {
    try {
      const { partyId, type } = req.params;
      
      // Validate address type
      if (!['billing', 'shipping', 'both'].includes(type)) {
        return res.status(400).json({ error: 'Invalid address type. Must be "billing", "shipping", or "both"' });
      }
      
      // Check if party exists
      const party = PartyModel.getById(partyId);
      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }
      
      const address = AddressModel.getDefaultForParty(partyId, type);
      
      if (!address) {
        return res.status(404).json({ 
          error: `No default ${type} address found for this party`,
          partyId: parseInt(partyId),
          addressType: type
        });
      }
      
      res.json(address);
    } catch (error) {
      console.error(`Error getting default address for party ${req.params.partyId}:`, error);
      res.status(500).json({ error: 'Failed to retrieve default address' });
    }
  },

  /**
   * Create a new address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createAddress(req, res) {
    try {
      const { 
        address_line1, 
        address_line2, 
        city, 
        state,
        county,
        postal_code, 
        country,
        sales_tax_id,
        party_id,
        address_type,
        is_default
      } = req.body;

      if (!address_line1 || !city || !state || !postal_code) {
        return res.status(400).json({ error: 'Address line 1, city, state, and postal code are required' });
      }

      // Check if sales_tax_id is valid if provided
      if (sales_tax_id) {
        const salesTax = SalesTaxModel.getById(sales_tax_id);
        if (!salesTax) {
          return res.status(404).json({ error: 'Sales tax not found' });
        }
      }

      const addressData = {
        address_line1,
        address_line2,
        city,
        state,
        county,
        postal_code,
        country,
        sales_tax_id
      };

      // Create the address
      const newAddress = AddressModel.create(addressData);

      // If party_id and address_type are provided, associate with party
      if (party_id && address_type) {
        // Check if party exists
        const party = PartyModel.getById(party_id);
        if (!party) {
          // Delete the created address since party doesn't exist
          AddressModel.delete(newAddress.id);
          return res.status(404).json({ error: 'Party not found' });
        }

        // Validate address type
        if (!['billing', 'shipping', 'both'].includes(address_type)) {
          // Delete the created address since type is invalid
          AddressModel.delete(newAddress.id);
          return res.status(400).json({ error: 'Invalid address type. Must be "billing", "shipping", or "both"' });
        }

        // Associate address with party
        AddressModel.associateWithParty(
          party_id, 
          newAddress.id, 
          address_type, 
          is_default === true
        );
      }

      res.status(201).json(newAddress);
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  },

  /**
   * Update an address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateAddress(req, res) {
    try {
      const { id } = req.params;
      const { 
        address_line1, 
        address_line2, 
        city, 
        state,
        county,
        postal_code, 
        country,
        sales_tax_id
      } = req.body;

      // Check if the address exists
      const existingAddress = AddressModel.getById(id);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (!address_line1 || !city || !state || !postal_code) {
        return res.status(400).json({ error: 'Address line 1, city, state, and postal code are required' });
      }

      // Check if sales_tax_id is valid if provided
      if (sales_tax_id) {
        const salesTax = SalesTaxModel.getById(sales_tax_id);
        if (!salesTax) {
          return res.status(404).json({ error: 'Sales tax not found' });
        }
      }

      const addressData = {
        address_line1,
        address_line2,
        city,
        state,
        county,
        postal_code,
        country,
        sales_tax_id
      };

      const updatedAddress = AddressModel.update(id, addressData);
      res.json(updatedAddress);
    } catch (error) {
      console.error(`Error updating address ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  },

  /**
   * Delete an address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteAddress(req, res) {
    try {
      const { id } = req.params;

      // Check if the address exists
      const existingAddress = AddressModel.getById(id);
      if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found' });
      }

      // Delete the address
      const success = AddressModel.delete(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete address' });
      }
    } catch (error) {
      console.error(`Error deleting address ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete address' });
    }
  },

  /**
   * Associate an address with a party
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  associateWithParty(req, res) {
    try {
      const { partyId, addressId } = req.params;
      const { address_type, is_default } = req.body;

      // Check if party exists
      const party = PartyModel.getById(partyId);
      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }

      // Check if address exists
      const address = AddressModel.getById(addressId);
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }

      // Validate address type
      if (!address_type || !['billing', 'shipping', 'both'].includes(address_type)) {
        return res.status(400).json({ error: 'Invalid address type. Must be "billing", "shipping", or "both"' });
      }

      // Associate address with party
      const result = AddressModel.associateWithParty(
        partyId, 
        addressId, 
        address_type, 
        is_default === true
      );

      res.status(201).json(result);
    } catch (error) {
      console.error(`Error associating address ${req.params.addressId} with party ${req.params.partyId}:`, error);
      res.status(500).json({ error: 'Failed to associate address with party' });
    }
  },

  /**
   * Remove association between address and party
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeAssociation(req, res) {
    try {
      const { partyId, addressId } = req.params;
      const { address_type } = req.query;

      // Check if party exists
      const party = PartyModel.getById(partyId);
      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }

      // Check if address exists
      const address = AddressModel.getById(addressId);
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }

      // Validate address type if provided
      if (address_type && !['billing', 'shipping', 'both'].includes(address_type)) {
        return res.status(400).json({ error: 'Invalid address type. Must be "billing", "shipping", or "both"' });
      }

      // Remove association
      const success = AddressModel.removeAssociation(partyId, addressId, address_type);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ error: 'Association not found' });
      }
    } catch (error) {
      console.error(`Error removing association between address ${req.params.addressId} and party ${req.params.partyId}:`, error);
      res.status(500).json({ error: 'Failed to remove association' });
    }
  }
};

module.exports = AddressController;