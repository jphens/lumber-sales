<template>
  <div class="ticket-form">
    <h2>{{ isEditMode ? 'Edit' : 'New' }} Lumber Sales Ticket</h2>
    
    <div v-if="loading" class="loading">
      Loading ticket data...
    </div>
    
    <div v-else-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <template v-else>
      <div class="form-section">
        <h3>Customer Information</h3>
        <div class="customer-info">
          <div class="form-group">
            <label>Invoice #</label>
            <!-- Only show invoice number when editing an existing ticket -->
            <input v-if="isEditMode" v-model="ticket.invoice_number" class="form-control" disabled />
            <input v-else value="(Auto-assigned)" class="form-control" disabled />
          </div>
          <div class="form-group">
            <label>Customer</label>
            <div class="autocomplete">
              <input 
                v-model="customerSearch" 
                class="form-control"
                placeholder="Enter customer name or ID"
                @input="searchCustomers" 
              />
              <div class="search-results" v-if="customerResults.length > 0">
                <div
                  v-for="result in customerResults"
                  :key="result.id"
                  class="search-item"
                  @click="selectCustomer(result)"
                >
                  {{ result.list_name }}
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Customer Name</label>
            <input v-model="ticket.customerName" class="form-control" />
          </div>
          <div class="form-group">
            <label>Customer Phone</label>
            <input v-model="ticket.customerPhone" class="form-control" />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="ticket.date" class="form-control" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="ticket.status" class="form-control">
              <option value="draft">Quote</option>
              <option value="final">Invoice</option>
              <option value="paid">Purchase Order</option>
              <option value="void">Bill of Lading</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Addresses</h3>
        <div class="addresses">
          <div class="form-group">
            <label>Bill to</label>
            <select v-model="ticket.billing_address_id" class="form-control">
              <option v-for="address in billingAddresses" 
                      :key="address.id" 
                      :value="address.id">
                {{ formatAddress(address) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Ship to</label>
            <select v-model="ticket.shipping_address_id" class="form-control">
              <option v-for="address in shippingAddresses" 
                      :key="address.id" 
                      :value="address.id">
                {{ formatAddress(address) }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h3>Lumber Items</h3>
        <div class="lumber-items">
          <table class="table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Quantity</th>
                <th>Thickness (in)</th>
                <th>Width (in)</th>
                <th>Length (ft)</th>
                <th>BF</th>
                <th>Price/MBF</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ticket.items" :key="index">
                <td>
                  <select v-model="item.species_id" class="form-control" @change="calculateItemTotal(index)">
                    <option value="">Select Species</option>
                    <option v-for="species in speciesList" :key="species.id" :value="species.id">
                      {{ species.list_name }}
                    </option>
                  </select>
                </td>
                <td>
                  <input type="number" v-model.number="item.quantity" class="form-control" @change="calculateItemTotal(index)" />
                </td>                <td>
                  <input type="number" v-model.number="item.thickness" class="form-control" @change="calculateItemTotal(index)" />
                </td>
                <td>
                  <input type="number" v-model.number="item.width" class="form-control" @change="calculateItemTotal(index)" />
                </td>
                <td>
                  <input type="number" v-model.number="item.length" class="form-control" @change="calculateItemTotal(index)" />
                </td>
                <td>{{ formatNumber(item.total_bf) }}</td>
                <td>
                  <input type="number" v-model.number="item.price_per_mbf" class="form-control" @change="calculateItemTotal(index)" />
                </td>
                <td>${{ formatCurrency(item.total_amount) }}</td>
                <td>
                  <button @click="removeItem(index)" class="btn btn-danger btn-sm">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button @click="addItem" class="btn btn-primary">Add Item</button>
        </div>
      </div>
      
      <div class="totals">
        <div class="d-flex justify-content-end">
          <div class="totals-content">
            <div class="total-row">
              <span class="label">Subtotal:</span>
              <span class="value">${{ formatCurrency(calculateSubtotal()) }}</span>
            </div>
            <div class="total-row">
              <span class="label">Tax:</span>
              <span class="value">${{ formatCurrency(ticket.total_tax) }}</span>
            </div>
            <div class="total-row">
              <span class="label">Total:</span>
              <span class="value">${{ formatCurrency(ticket.total_amount) }}</span>
            </div>
            <div class="total-row">
              <span class="label">Total Board Feet:</span>
              <span class="value">{{ formatNumber(ticket.total_bf) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button @click="saveTicket" class="btn btn-success" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Ticket' }}
        </button>
        <button @click="printTicket" class="btn btn-info">Print Ticket</button>
        <button @click="cancel" class="btn btn-secondary">Cancel</button>
      </div>
    </template>
  </div>
</template>

<script>
import { TicketService } from '../services/api';

export default {
  props: {
    id: {
      type: [String, Number],
      required: false
    }
  },
  data() {
    return {
      ticket: {
        id: this.generateId(),
        invoice_number: null, // Will be assigned by the server for new tickets
        party_id: null,
        billing_address_id: null,
        shipping_address_id: null,
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        total_bf: 0,
        total_tax: 0,
        total_amount: 0,
        items: []
      },
      isEditMode: false,
      loading: false,
      saving: false,
      error: null,
      customerSearch: '',
      customerResults: [],
      customerAddresses: [],
      speciesList: [],
      taxRate: 0 // Set to your default tax rate or 0 if no tax
    };
  },
  computed: {
    // Computed property to filter billing addresses
    billingAddresses() {
      return this.customerAddresses.filter(address => 
        address.address_type === 'billing' || address.address_type === 'both'
      );
    },
    
    // Computed property to filter shipping addresses
    shippingAddresses() {
      return this.customerAddresses.filter(address => 
        address.address_type === 'shipping' || address.address_type === 'both'
      );
    },
    
    // API base URL
    $apiBaseUrl() {
      return process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
    }
  },
  methods: {
    generateId() {
      return 'T' + Date.now().toString();
    },
    formatNumber(value) {
      return Number(value).toFixed(2);
    },
    formatCurrency(value) {
      return Number(value).toFixed(2);
    },
    formatAddress(address) {
      return `${address.address_line1}, ${address.city}, ${address.state} ${address.postal_code}`;
    },
    addItem() {
      this.ticket.items.push({
        species_id: '',
        quantity: 1,
        width: 2,
        thickness: 4,
        length: 8,
        price_per_mbf: 1000.00,
        total_bf: 0,
        total_tax: 0,
        total_amount: 0
      });
      this.calculateItemTotal(this.ticket.items.length - 1);
    },
    removeItem(index) {
      this.ticket.items.splice(index, 1);
      this.calculateTotals();
    },
    calculateItemTotal(index) {
      const item = this.ticket.items[index];
      
      // Board Feet calculation: (Width × Thickness × Length) / 12
      const boardFeet = (item.width * item.thickness * item.length) / 12 * item.quantity;
      item.total_bf = boardFeet;
      
      // Calculate amount: BF × (Price per MBF / 1000)
      const amount = boardFeet * (item.price_per_mbf / 1000);
      
      // Calculate tax
      item.total_tax = amount * this.taxRate;
      
      // Set total amount
      item.total_amount = amount + item.total_tax;
      
      this.calculateTotals();
    },
    calculateSubtotal() {
      return this.ticket.items.reduce((sum, item) => sum + (item.total_amount - item.total_tax), 0);
    },
    calculateTotals() {
      // Calculate total board feet
      this.ticket.total_bf = this.ticket.items.reduce((sum, item) => sum + item.total_bf, 0);
      
      // Calculate total tax
      this.ticket.total_tax = this.ticket.items.reduce((sum, item) => sum + item.total_tax, 0);
      
      // Calculate total amount
      this.ticket.total_amount = this.ticket.items.reduce((sum, item) => sum + item.total_amount, 0);
    },
    async saveTicket() {
      this.saving = true;
      try {
        if (this.isEditMode) {
          // Update existing ticket
          const updatedTicket = await TicketService.updateTicket(this.id, this.ticket);
          alert('Ticket updated!');
          // Update the local ticket with any changes from the server
          this.ticket = updatedTicket;
        } else {
          // Create new ticket
          const newTicket = await TicketService.createTicket(this.ticket);
          alert('Ticket saved!');
          // The server assigns the invoice number, let's update the UI
          this.ticket.invoice_number = newTicket.invoice_number;
          this.resetForm();
        }
        this.$router.push('/list');
      } catch (error) {
        alert(`Failed to save ticket: ${error.message}`);
      } finally {
        this.saving = false;
      }
    },
    printTicket() {
      if (this.isEditMode) {
        this.$router.push(`/print/${this.id}`);
      } else {
        alert('Please save the ticket before printing.');
      }
    },
    cancel() {
      this.$router.push('/list');
    },
    resetForm() {
      this.ticket = {
        id: this.generateId(),
        invoice_number: null, // Will be assigned by the server
        party_id: null,
        billing_address_id: null,
        shipping_address_id: null,
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        total_bf: 0,
        total_tax: 0,
        total_amount: 0,
        items: []
      };
      this.addItem();
      this.customerSearch = '';
      this.customerResults = [];
      this.customerAddresses = [];
    },
    async loadTicket() {
      if (!this.id) return;
      
      this.isEditMode = true;
      this.loading = true;
      
      try {
        const ticket = await TicketService.getTicket(this.id);
        this.ticket = ticket;
        
        // If the ticket has a party_id, load customer addresses
        if (ticket.party_id) {
          await this.loadCustomerAddresses(ticket.party_id);
        }
      } catch (error) {
        this.error = `Failed to load ticket: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
    async searchCustomers() {
      if (this.customerSearch.length < 2) {
        this.customerResults = [];
        return;
      }
      
      try {
        // Call your API to search customers
        const response = await fetch(`${this.$apiBaseUrl}/parties/search?term=${encodeURIComponent(this.customerSearch)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.customerResults = await response.json();
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    },
    async selectCustomer(customer) {
      this.customerSearch = customer.list_name;
      this.customerResults = [];
      this.ticket.party_id = customer.id;
      this.ticket.customerName = customer.name;
      this.ticket.customerPhone = customer.phone || '';
      
      // Load customer addresses
      await this.loadCustomerAddresses(customer.id);
    },
    async loadCustomerAddresses(partyId) {
      try {
        // Call your API to get customer addresses
        const response = await fetch(`${this.$apiBaseUrl}/addresses/party/${partyId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.customerAddresses = await response.json();
        
        // Set default billing and shipping addresses if available
        const defaultBilling = this.billingAddresses.find(a => a.is_default);
        const defaultShipping = this.shippingAddresses.find(a => a.is_default);
        
        if (defaultBilling) {
          this.ticket.billing_address_id = defaultBilling.id;
        }
        
        if (defaultShipping) {
          this.ticket.shipping_address_id = defaultShipping.id;
        }
      } catch (error) {
        console.error('Error loading customer addresses:', error);
      }
    },
    async loadSpecies() {
      try {
        // Call your API to get all species
        const response = await fetch(`${this.$apiBaseUrl}/species`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        this.speciesList = await response.json();
      } catch (error) {
        console.error('Error loading species:', error);
      }
    }
  },
  created() {
    // Load species list
    this.loadSpecies();
    
    // Start with one empty item if not in edit mode
    if (!this.id) {
      this.addItem();
    } else {
      this.loadTicket();
    }
  }
};
</script>

<style>
.ticket-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 30px;
}

.customer-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.addresses {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.autocomplete {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  z-index: 1000;
}

.search-item {
  padding: 8px 12px;
  cursor: pointer;
}

.search-item:hover {
  background-color: #f8f9fa;
}

.totals {
  margin-top: 20px;
  margin-bottom: 20px;
}

.totals-content {
  min-width: 300px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.total-row .label {
  font-weight: bold;
}

.actions {
  margin-top: 20px;
}

.actions button {
  margin-right: 10px;
}

.loading, .error {
  text-align: center;
  margin: 20px 0;
  padding: 10px;
}

.error {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

@media print {
  .actions, button {
    display: none;
  }
}
</style>