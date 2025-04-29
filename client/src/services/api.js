// API service for communicating with the backend
import config from '../config';

// Base URL for API requests
const API_URL = config.apiUrl;

/**
 * Generic API request handler
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

/**
 * API service for ticket operations
 */
export const TicketService = {
  /**
   * Get all tickets
   * @returns {Promise<Array>} Array of ticket objects
   */
  async getAllTickets() {
    return apiRequest(`${API_URL}/tickets`);
  },

  /**
   * Get a ticket by ID
   * @param {string} id - Ticket ID
   * @returns {Promise<Object>} Ticket object
   */
  async getTicket(id) {
    return apiRequest(`${API_URL}/tickets/${id}`);
  },

  /**
   * Create a new ticket
   * @param {Object} ticket - Ticket data
   * @returns {Promise<Object>} Created ticket
   */
  async createTicket(ticket) {
    return apiRequest(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticket),
    });
  },

  /**
   * Update an existing ticket
   * @param {string} id - Ticket ID
   * @param {Object} ticket - Updated ticket data
   * @returns {Promise<Object>} Updated ticket
   */
  async updateTicket(id, ticket) {
    return apiRequest(`${API_URL}/tickets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticket),
    });
  },

  /**
   * Delete a ticket
   * @param {string} id - Ticket ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTicket(id) {
    await apiRequest(`${API_URL}/tickets/${id}`, {
      method: 'DELETE',
    });
    return true;
  }
};

/**
 * API service for party operations
 */
export const PartyService = {
  /**
   * Get all parties
   * @returns {Promise<Array>} Array of party objects
   */
  async getAllParties() {
    return apiRequest(`${API_URL}/parties`);
  },

  /**
   * Get parties by type
   * @param {string} type - Party type (e.g., 'customer', 'vendor')
   * @returns {Promise<Array>} Array of party objects
   */
  async getPartiesByType(type) {
    return apiRequest(`${API_URL}/parties/type/${type}`);
  },

  /**
   * Search parties
   * @param {string} term - Search term
   * @returns {Promise<Array>} Array of party objects
   */
  async searchParties(term) {
    return apiRequest(`${API_URL}/parties/search?term=${encodeURIComponent(term)}`);
  },

  /**
   * Get a party by ID
   * @param {number} id - Party ID
   * @returns {Promise<Object>} Party object
   */
  async getParty(id) {
    return apiRequest(`${API_URL}/parties/${id}`);
  },

  /**
   * Get a party with addresses
   * @param {number} id - Party ID
   * @returns {Promise<Object>} Party object with addresses
   */
  async getPartyWithAddresses(id) {
    return apiRequest(`${API_URL}/parties/${id}/addresses`);
  },

  /**
   * Create a new party
   * @param {Object} party - Party data
   * @returns {Promise<Object>} Created party
   */
  async createParty(party) {
    return apiRequest(`${API_URL}/parties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(party),
    });
  },

  /**
   * Update an existing party
   * @param {number} id - Party ID
   * @param {Object} party - Updated party data
   * @returns {Promise<Object>} Updated party
   */
  async updateParty(id, party) {
    return apiRequest(`${API_URL}/parties/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(party),
    });
  },

  /**
   * Delete a party
   * @param {number} id - Party ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteParty(id) {
    await apiRequest(`${API_URL}/parties/${id}`, {
      method: 'DELETE',
    });
    return true;
  }
};

/**
 * API service for customer operations
 */
export const CustomerService = {
  /**
   * Get all customers
   * @returns {Promise<Array>} Array of customer objects
   */
  async getAllCustomers() {
    return apiRequest(`${API_URL}/customers`);
  },

  /**
   * Get a customer by ID
   * @param {number} id - Customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomer(id) {
    return apiRequest(`${API_URL}/customers/${id}`);
  },

  /**
   * Get a customer with addresses
   * @param {number} id - Customer ID
   * @returns {Promise<Object>} Customer object with addresses
   */
  async getCustomerWithAddresses(id) {
    return apiRequest(`${API_URL}/customers/${id}/addresses`);
  },

  /**
   * Get a customer by party ID
   * @param {number} partyId - Party ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomerByPartyId(partyId) {
    return apiRequest(`${API_URL}/customers/party/${partyId}`);
  },

  /**
   * Create a new customer
   * @param {Object} customer - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customer) {
    return apiRequest(`${API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
  },

  /**
   * Update an existing customer
   * @param {number} id - Customer ID
   * @param {Object} customer - Updated customer data
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomer(id, customer) {
    return apiRequest(`${API_URL}/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
  },

  /**
   * Delete a customer
   * @param {number} id - Customer ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCustomer(id) {
    await apiRequest(`${API_URL}/customers/${id}`, {
      method: 'DELETE',
    });
    return true;
  }
};

/**
 * API service for address operations
 */
export const AddressService = {
  /**
   * Get all addresses
   * @returns {Promise<Array>} Array of address objects
   */
  async getAllAddresses() {
    return apiRequest(`${API_URL}/addresses`);
  },

  /**
   * Get an address by ID
   * @param {number} id - Address ID
   * @returns {Promise<Object>} Address object
   */
  async getAddress(id) {
    return apiRequest(`${API_URL}/addresses/${id}`);
  },

  /**
   * Get addresses for a party
   * @param {number} partyId - Party ID
   * @returns {Promise<Array>} Array of address objects
   */
  async getAddressesForParty(partyId) {
    return apiRequest(`${API_URL}/addresses/party/${partyId}`);
  },

  /**
   * Get default address for a party
   * @param {number} partyId - Party ID
   * @param {string} type - Address type ('billing', 'shipping', 'both')
   * @returns {Promise<Object>} Address object
   */
  async getDefaultAddressForParty(partyId, type) {
    return apiRequest(`${API_URL}/addresses/party/${partyId}/default/${type}`);
  },

  /**
   * Create a new address
   * @param {Object} address - Address data
   * @returns {Promise<Object>} Created address
   */
  async createAddress(address) {
    return apiRequest(`${API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });
  },

  /**
   * Update an existing address
   * @param {number} id - Address ID
   * @param {Object} address - Updated address data
   * @returns {Promise<Object>} Updated address
   */
  async updateAddress(id, address) {
    return apiRequest(`${API_URL}/addresses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });
  },

  /**
   * Delete an address
   * @param {number} id - Address ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAddress(id) {
    await apiRequest(`${API_URL}/addresses/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * Associate an address with a party
   * @param {number} partyId - Party ID
   * @param {number} addressId - Address ID
   * @param {string} addressType - Address type ('billing', 'shipping', 'both')
   * @param {boolean} isDefault - Whether this is the default address
   * @returns {Promise<Object>} Association result
   */
  async associateWithParty(partyId, addressId, addressType, isDefault) {
    return apiRequest(`${API_URL}/addresses/party/${partyId}/address/${addressId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address_type: addressType, is_default: isDefault }),
    });
  },

  /**
   * Remove association between address and party
   * @param {number} partyId - Party ID
   * @param {number} addressId - Address ID
   * @param {string} addressType - Optional address type
   * @returns {Promise<boolean>} Success status
   */
  async removeAssociation(partyId, addressId, addressType) {
    const queryParams = addressType ? `?address_type=${addressType}` : '';
    await apiRequest(`${API_URL}/addresses/party/${partyId}/address/${addressId}${queryParams}`, {
      method: 'DELETE',
    });
    return true;
  }
};

/**
 * API service for species operations
 */
export const SpeciesService = {
  /**
   * Get all species
   * @returns {Promise<Array>} Array of species objects
   */
  async getAllSpecies() {
    return apiRequest(`${API_URL}/species`);
  },

  /**
   * Get a species by ID
   * @param {number} id - Species ID
   * @returns {Promise<Object>} Species object
   */
  async getSpecies(id) {
    return apiRequest(`${API_URL}/species/${id}`);
  },

  /**
   * Get a species by species number
   * @param {string} number - Species number
   * @returns {Promise<Object>} Species object
   */
  async getSpeciesByNumber(number) {
    return apiRequest(`${API_URL}/species/number/${number}`);
  },

  /**
   * Search species
   * @param {string} term - Search term
   * @returns {Promise<Array>} Array of species objects
   */
  async searchSpecies(term) {
    return apiRequest(`${API_URL}/species/search?term=${encodeURIComponent(term)}`);
  },

  /**
   * Create a new species
   * @param {Object} species - Species data
   * @returns {Promise<Object>} Created species
   */
  async createSpecies(species) {
    return apiRequest(`${API_URL}/species`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(species),
    });
  },

  /**
   * Update an existing species
   * @param {number} id - Species ID
   * @param {Object} species - Updated species data
   * @returns {Promise<Object>} Updated species
   */
  async updateSpecies(id, species) {
    return apiRequest(`${API_URL}/species/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(species),
    });
  },

  /**
   * Delete a species
   * @param {number} id - Species ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSpecies(id) {
    await apiRequest(`${API_URL}/species/${id}`, {
      method: 'DELETE',
    });
    return true;
  }
};

// Export services as default object and individual services
export default {
  ticket: TicketService,
  party: PartyService,
  customer: CustomerService,
  address: AddressService,
  species: SpeciesService
};