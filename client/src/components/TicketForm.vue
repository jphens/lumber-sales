// client/src/components/TicketForm.vue

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

      <!-- SECTION: TICKET INFORMATION -->
      <div class="form-section">
        <h3>Ticket Information</h3>
        <div class="customer-info">
          <div class="form-group">
            <label>Customer</label>
            <div class="autocomplete">
              <input v-model="customerSearch" class="form-control" placeholder="Enter customer name or ID"
                @input="searchCustomers" @keydown="handleCustomerKeydown" @focus="showAllCustomers" @blur="handleBlur"
                ref="customerSearchInput" />
              <div class="search-results" v-if="customerResults.length > 0 && showResults">
                <div v-for="(result, index) in customerResults" :key="result.id" class="search-item"
                  :class="{ 'active': index === selectedResultIndex }" @click="selectCustomer(result)"
                  @mouseover="selectedResultIndex = index">
                  {{ result.list_name }}
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="ticket.date" class="form-control" />
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" v-model="ticket.due_date" class="form-control" />
          </div>
          <div class="form-group">
            <label>Invoice #</label>
            <!-- Only show invoice number when editing an existing ticket -->
            <input v-if="isEditMode" v-model="ticket.invoice_number" class="form-control" disabled />
            <input v-else value="(Auto-assigned)" class="form-control" disabled />
          </div>
        </div>
        <div class="customer-info">
          <div class="form-group">
            <label>Customer Name</label>
            <input v-model="ticket.customerName" class="form-control" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="ticket.ticket_type" class="form-control">
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
              <option value="po">Purchase Order</option>
              <option value="bol">Bill of Lading</option>
            </select>
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
          <div class="form-group">
            <label>Customer PO#</label>
            <input v-model="ticket.purchase_order" class="form-control" />
          </div>
        </div>
      </div>

      <!-- SECTION: BILLING & SHIPPING-->
      <div class="form-section">
        <h3>Billing & Shipping</h3>
        <div class="addresses">
          <div class="form-group">
            <label>Bill to</label>
            <select v-model="ticket.billing_address_id" class="form-control">
              <option v-for="address in billingAddresses" :key="address.id" :value="address.id">
                {{ formatAddressSimple(address) }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Ship to</label>
            <select v-model="ticket.shipping_address_id" class="form-control" @change="updateSalesTax">
              <option v-for="address in shippingAddresses" :key="address.id" :value="address.id">
                {{ formatAddressSimple(address) }}
              </option>
            </select>
          </div>
        </div>
        <div class="shipping-details">
          <div class="form-group">
            <label>Customer Email</label>
            <input v-model="customerData.email" class="form-control" v-if="customerData" />
            <input class="form-control" disabled v-else placeholder="Select a customer first" />
          </div>
          <div class="form-group">
            <label>Customer Phone</label>
            <input v-model="ticket.customerPhone" class="form-control" />
          </div>
          <div class="form-group">
            <label>Ship Via</label>
            <select v-model="ticket.ship_via_id" class="form-control" @change="updateSalesTax">
              <option v-for="method in shipViaMethods" :key="method.id" :value="method.id">
                {{ method.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Attention to</label>
            <input v-model="ticket.shipping_attention" class="form-control" />
          </div>
          <div class="form-group hidden">
            <label>Sales Tax</label>
            <select v-model="ticket.sales_tax_id" class="form-control" @change="recalculateTax">
              <option v-for="tax in salesTaxRates" :key="tax.id" :value="tax.id">
                {{ tax.name }} ({{ formatPercent(tax.tax_rate) }})
              </option>
            </select>
            <div v-if="customerIsTaxExempt" class="tax-exempt-notice">
              Customer is tax exempt.
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION: LUMBER ITEMS-->
      <div class="form-section">
        <div class="section-header">
          <h3>Lumber Items</h3>
          <button @click="addItem" class="btn btn-primary">Add Item</button>
        </div>
        <div class="lumber-items">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px"></th>
                <th style="width: 20%">Species</th>
                <th style="width: 8%">Qty</th>
                <th style="width: 28%">Dimensions</th>
                <th style="width: 12%">BF</th>
                <th style="width: 15%">Price/MBF</th>
                <th style="width: 15%">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ticket.items" :key="index">
                <td>
                  <button @click="removeItem(index)" class="btn btn-danger btn-sm btn-icon"
                    :disabled="ticket.items.length === 1">X</button>
                </td>
                <td>
                  <select v-model="item.species_id" class="form-control form-control-sm"
                    @change="calculateItemTotal(index)" ref="firstField">
                    <option value="">Select Species</option>
                    <option v-for="species in speciesList" :key="species.id" :value="species.id">
                      {{ species.list_name }}
                    </option>
                  </select>
                </td>
                <td>
                  <input type="number" v-model.number="item.quantity" class="form-control form-control-sm text-center"
                    @change="calculateItemTotal(index)" min="0" />
                </td>
                <td>
                  <div class="input-group input-group-sm">
                    <input type="number" v-model.number="item.thickness"
                      class="form-control text-right lumber-dimension" @change="calculateItemTotal(index)" min="0"
                      step="0.01" />
                    <div class="input-group-text">×</div>
                    <input type="number" v-model.number="item.width" class="form-control text-right lumber-dimension"
                      @change="calculateItemTotal(index)" min="0" step="0.01" />
                    <div class="input-group-text">×</div>
                    <input type="number" v-model.number="item.length" class="form-control text-right lumber-dimension"
                      @change="calculateItemTotal(index)" min="0" step="0.01" />
                  </div>
                </td>
                <td class="text-right">{{ formatNumber(item.total_bf) }}</td>
                <td>
                  <div class="input-group input-group-sm">
                    <div class="input-group-text">$</div>
                    <input type="number" v-model.number="item.price_per_mbf" class="form-control text-right"
                      @change="calculateItemTotal(index)" @keydown.tab="handleLastFieldTab(index, $event)"
                      ref="lastField" min="0" step="0.01" />
                  </div>
                </td>
                <td class="text-right">${{ formatCurrency(item.total_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION: TOTALS -->
      <div class="form-section">
        <div class="totals">
          <div class="totals-flex">
            <div class="total-item bf-total">
              <span class="label">Total Board Feet:</span>
              <span class="value">{{ formatNumber(ticket.total_bf) }}</span>
            </div>

            <div class="flex-spacer"></div>

            <div class="totals-block">
              <div class="total-row">
                <span class="label">Subtotal:</span>
                <span class="value">${{ formatCurrency(calculateSubtotal()) }}</span>
              </div>
              <div class="total-row">
                <span class="label">Freight:</span>
                <span class="value">$<input type="number" v-model.number="ticket.total_freight" class="freight-input"
                    @change="calculateTotals" /></span>
              </div>
              <!-- New Sales Tax dropdown -->
              <div class="total-row">
                <span class="label">Sales Tax:</span>
                <span class="value">
                  <select v-model="ticket.sales_tax_id" class="form-control tax-select" @change="recalculateTax">
                    <option v-for="tax in salesTaxRates" :key="tax.id" :value="tax.id">
                      {{ tax.name }} ({{ formatPercent(tax.tax_rate) }})
                    </option>
                  </select>
                  <div v-if="customerIsTaxExempt" class="tax-exempt-notice">Customer is tax exempt.</div>
                </span>
              </div>
              <div class="total-row">
                <span class="label">Tax:</span>
                <span class="value">${{ formatCurrency(ticket.total_tax) }}</span>
              </div>
              <div class="total-row">
                <span class="label">Total:</span>
                <span class="value">${{ formatCurrency(calculateGrandTotal()) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODIFIED: Buttons section with new buttons -->
      <div class="actions">
        <button @click="saveAndClose" class="btn btn-success" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save & Close' }}
        </button>
        <button @click="saveAndPrint" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save & Print' }}
        </button>
        <button @click="cancel" class="btn btn-secondary">Cancel</button>
      </div>
    </template>
  </div>
</template>

<script>
import {
  TicketService,
  SalesTaxService,
  ShipViaService,
  CustomerService,
  AddressService,
  PartyService,
  SpeciesService
} from '../services/api';
import { nextTick } from 'vue';

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
        ship_via_id: null,
        sales_tax_id: null,
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        due_date: this.calculateDueDate(), // Connect the due date
        ticket_type: 'invoice', // Connect the ticket type
        purchase_order: '', // Connect the customer PO#
        shipping_attention: '', // Connect the attention field
        total_freight: 0, // Connect the freight field
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
      allCustomers: [],
      selectedResultIndex: -1,
      showResults: false,
      customerAddresses: [],
      customerData: null,
      customerIsTaxExempt: false,
      speciesList: [],
      salesTaxRates: [],
      shipViaMethods: [],
      currentTaxRate: 0,
      defaultItemValues: {
        species_id: '',
        quantity: null,
        width: null,
        thickness: null,
        length: null,
        price_per_mbf: null,
        total_bf: 0,
        tax_amount: 0,
        total_tax: 0,
        total_amount: 0
      }
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

    // Get the selected sales tax
    selectedSalesTax() {
      if (!this.ticket.sales_tax_id) return null;
      return this.salesTaxRates.find(tax => tax.id === this.ticket.sales_tax_id);
    },

    // API base URL
    $apiBaseUrl() {
      return process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
    }
  },
  methods: {
    calculateDueDate() {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    },
    generateId() {
      return 'T' + Date.now().toString();
    },
    formatNumber(value) {
      return Number(value || 0).toFixed(2);
    },
    formatCurrency(value) {
      return Number(value || 0).toFixed(2);
    },
    formatPercent(value) {
      return (Number(value || 0) * 100).toFixed(2) + '%';
    },
    formatAddressSimple(address) {
      let formattedAddress = `${address.address_line1}`;
      if (address.address_line2) {
        formattedAddress += `, ${address.address_line2}`;
      }
      formattedAddress += `, ${address.city}, ${address.state} ${address.postal_code}`;
      return formattedAddress;
    },
    // Modified to use default values from data property
    addItem() {
      // Create a new item with default values - using spread to create a fresh copy
      const newItem = { ...this.defaultItemValues };
      this.ticket.items.push(newItem);
      this.calculateItemTotal(this.ticket.items.length - 1);

      // Focus on the first field of the new row after Vue updates the DOM
      nextTick(() => {
        const firstFields = this.$refs.firstField;
        if (firstFields && firstFields.length) {
          firstFields[firstFields.length - 1].focus();
        }
      });
    },
    // Add validation to prevent removing the last item
    removeItem(index) {
      // Don't allow removing the last item
      if (this.ticket.items.length <= 1) return;

      this.ticket.items.splice(index, 1);
      this.calculateTotals();
    },
    calculateItemTotal(index) {
      const item = this.ticket.items[index];

      // Board Feet calculation: (Width × Thickness × Length) / 12
      const boardFeet = (item.width * item.thickness * item.length) / 12 * item.quantity;
      item.total_bf = boardFeet;

      // Calculate base amount without tax: BF × (Price per MBF / 1000)
      const baseAmount = boardFeet * (item.price_per_mbf / 1000);

      // Calculate tax based on the selected tax rate
      const taxRate = this.customerIsTaxExempt ? 0 : (this.selectedSalesTax ? this.selectedSalesTax.tax_rate : 0);
      item.tax_amount = baseAmount * taxRate;

      // Set total amount (base amount plus tax)
      item.total_amount = baseAmount;
      item.total_tax = item.tax_amount;

      this.calculateTotals();
    },
    // New method to handle tab key on the last field of a row
    handleLastFieldTab(index, event) {
      // Only proceed if we're on the last field of the row and not pressing shift
      if (!event.shiftKey) {
        // Check if this is the last row
        if (index === this.ticket.items.length - 1) {
          // Check if the current row has data before adding a new row
          const currentItem = this.ticket.items[index];
          const hasData = currentItem.quantity > 0 ||
            currentItem.width > 0 ||
            currentItem.thickness > 0 ||
            currentItem.length > 0 ||
            currentItem.price_per_mbf > 0 ||
            currentItem.species_id;

          if (hasData) {
            // Prevent default tab behavior
            event.preventDefault();

            // Add a new row
            this.addItem();
          }
        }
      }
    },
    calculateSubtotal() {
      // Calculate subtotal (sum of item totals without tax)
      return this.ticket.items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    },
    calculateGrandTotal() {
      // Calculate grand total (subtotal + tax + freight)
      return this.calculateSubtotal() + Number(this.ticket.total_tax || 0) + Number(this.ticket.total_freight || 0);
    },
    calculateTotals() {
      // Calculate total board feet
      this.ticket.total_bf = this.ticket.items.reduce((sum, item) => sum + (item.total_bf || 0), 0);

      // Calculate total tax
      this.ticket.total_tax = this.ticket.items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);

      // Calculate total amount (sum of all item totals without tax)
      this.ticket.total_amount = this.calculateSubtotal();
    },
    // MODIFIED: Save and close method - saves the ticket and returns to the list view
    async saveAndClose() {
      this.saving = true;
      try {
        // Remove any completely empty rows before saving
        this.ticket.items = this.ticket.items.filter(item => {
          return item.quantity > 0 ||
            item.width > 0 ||
            item.thickness > 0 ||
            item.length > 0 ||
            item.price_per_mbf > 0 ||
            item.species_id;
        });

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
        // Navigate to ticket list
        this.$router.push('/list');
      } catch (error) {
        alert(`Failed to save ticket: ${error.message}`);
      } finally {
        this.saving = false;
      }
    },
    // ADDED: Save and print method - saves the ticket and goes to print view
    async saveAndPrint() {
      this.saving = true;
      try {
        // Remove any completely empty rows before saving
        this.ticket.items = this.ticket.items.filter(item => {
          return item.quantity > 0 ||
            item.width > 0 ||
            item.thickness > 0 ||
            item.length > 0 ||
            item.price_per_mbf > 0 ||
            item.species_id;
        });

        let ticketId;

        if (this.isEditMode) {
          // Update existing ticket
          const updatedTicket = await TicketService.updateTicket(this.id, this.ticket);
          alert('Ticket updated!');
          // Update the local ticket with any changes from the server
          this.ticket = updatedTicket;
          ticketId = this.id;
        } else {
          // Create new ticket
          const newTicket = await TicketService.createTicket(this.ticket);
          alert('Ticket saved!');
          // The server assigns the invoice number, let's update the UI
          this.ticket.invoice_number = newTicket.invoice_number;
          ticketId = this.ticket.id;
          this.resetForm();
        }

        // Navigate to print view
        this.$router.push(`/print/${ticketId}`);

        // Use setTimeout to allow the print view to load before opening the print dialog
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (error) {
        alert(`Failed to save ticket: ${error.message}`);
      } finally {
        this.saving = false;
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
        ship_via_id: null,
        sales_tax_id: null,
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        due_date: this.calculateDueDate(),
        ticket_type: 'invoice',
        purchase_order: '',
        shipping_attention: '',
        total_freight: 0,
        status: 'draft',
        total_bf: 0,
        total_tax: 0,
        total_amount: 0,
        items: []
      };

      this.addItem();
      this.customerSearch = '';
      this.customerResults = [];
      this.selectedResultIndex = -1;
      this.customerAddresses = [];
      this.customerData = null;
      this.customerIsTaxExempt = false;
    },
    async loadTicket() {
      if (!this.id) return;

      this.isEditMode = true;
      this.loading = true;

      try {
        const ticket = await TicketService.getTicket(this.id);
        this.ticket = ticket;

        // If no due_date is set in the database, set it to 30 days after ticket date
        if (!ticket.due_date) {
          const ticketDate = new Date(ticket.date);
          ticketDate.setDate(ticketDate.getDate() + 30);
          this.ticket.due_date = ticketDate.toISOString().split('T')[0];
        }

        // If the ticket has a party_id, load customer addresses and data
        if (ticket.party_id) {
          await this.loadCustomerData(ticket.party_id);
        }
      } catch (error) {
        this.error = `Failed to load ticket: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },

    // New method to load all customers
    async loadAllCustomers() {
      try {
        // Get all parties that are customers (type='customer')
        this.allCustomers = await PartyService.getPartiesByType('customer');

        // Sort alphabetically by name
        this.allCustomers.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error('Error loading all customers:', error);
      }
    },

    // Show all customers when input is focused
    showAllCustomers() {
      this.showResults = true;

      if (this.customerSearch.trim() === '') {
        this.customerResults = [...this.allCustomers];
        this.selectedResultIndex = -1;
      } else {
        this.searchCustomers();
      }
    },

    // Handle blur event (when input loses focus)
    handleBlur() {
      // Delay hiding results to allow click events to register
      setTimeout(() => {
        this.showResults = false;
      }, 200);
    },

    // Modified to implement fuzzy search
    async searchCustomers() {
      this.showResults = true;

      if (this.customerSearch.trim() === '') {
        // Show all customers if search is empty
        this.customerResults = [...this.allCustomers];
        this.selectedResultIndex = -1;
        return;
      }

      // Local fuzzy search on allCustomers
      const searchTerm = this.customerSearch.toLowerCase();
      this.customerResults = this.allCustomers.filter(customer => {
        return customer.list_name.toLowerCase().includes(searchTerm) ||
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.party_number.toLowerCase().includes(searchTerm);
      });

      // Reset selected index when results change
      this.selectedResultIndex = -1;
    },

    // Handle keyboard navigation for customer results
    handleCustomerKeydown(event) {
      if (!this.showResults) return;

      // Auto-select if there's exactly one result and user presses Enter or Tab
      if ((event.key === 'Enter' || event.key === 'Tab') && this.customerResults.length === 1) {
        event.preventDefault();
        this.selectCustomer(this.customerResults[0]);
        return;
      }

      if (this.customerResults.length === 0) return;

      // Down arrow key
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedResultIndex = Math.min(this.selectedResultIndex + 1, this.customerResults.length - 1);
        this.ensureSelectedResultVisible();
      }
      // Up arrow key
      else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedResultIndex = Math.max(this.selectedResultIndex - 1, 0);
        this.ensureSelectedResultVisible();
      }
      // Enter key
      else if (event.key === 'Enter' && this.selectedResultIndex >= 0) {
        event.preventDefault();
        this.selectCustomer(this.customerResults[this.selectedResultIndex]);
      }
      // Tab key
      else if (event.key === 'Tab' && this.selectedResultIndex >= 0) {
        event.preventDefault();
        this.selectCustomer(this.customerResults[this.selectedResultIndex]);
      }
      // Escape key
      else if (event.key === 'Escape') {
        event.preventDefault();
        this.showResults = false;
      }
    },

    // Helper to ensure selected result is visible in dropdown
    ensureSelectedResultVisible() {
      nextTick(() => {
        if (this.selectedResultIndex >= 0) {
          const container = document.querySelector('.search-results');
          const selectedItem = container.querySelector('.search-item.active');

          if (container && selectedItem) {
            // Check if the selected item is outside the visible area
            const containerRect = container.getBoundingClientRect();
            const selectedRect = selectedItem.getBoundingClientRect();

            if (selectedRect.bottom > containerRect.bottom) {
              // Scroll down if selected item is below the visible area
              container.scrollTop += (selectedRect.bottom - containerRect.bottom);
            } else if (selectedRect.top < containerRect.top) {
              // Scroll up if selected item is above the visible area
              container.scrollTop += (selectedRect.top - containerRect.top);
            }
          }
        }
      });
    },

    async selectCustomer(customer) {
      this.customerSearch = customer.list_name;
      this.showResults = false;
      this.selectedResultIndex = -1;
      this.ticket.party_id = customer.id;
      this.ticket.customerName = customer.name;
      this.ticket.customerPhone = customer.phone || '';

      // Load customer data, addresses, and default shipping method
      await this.loadCustomerData(customer.id);
    },

    async loadCustomerData(partyId) {
      try {
        // Get customer data including tax exempt status and default shipping method
        this.customerData = await CustomerService.getCustomerByPartyId(partyId);

        // Set tax exempt status
        this.customerIsTaxExempt = this.customerData.sales_tax_exempt === 1;

        // Set default shipping method if available
        if (this.customerData.default_ship_via_id) {
          this.ticket.ship_via_id = this.customerData.default_ship_via_id;
        }

        // Get customer addresses
        this.customerAddresses = await AddressService.getAddressesForParty(partyId);

        // Set default billing and shipping addresses if available
        const defaultBilling = this.billingAddresses.find(a => a.is_default);
        const defaultShipping = this.shippingAddresses.find(a => a.is_default);

        if (defaultBilling) {
          this.ticket.billing_address_id = defaultBilling.id;
        }

        if (defaultShipping) {
          this.ticket.shipping_address_id = defaultShipping.id;
          this.updateSalesTax();
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
      }
    },
    async loadSpecies() {
      try {
        this.speciesList = await SpeciesService.getAllSpecies();
      } catch (error) {
        console.error('Error loading species:', error);
      }
    },
    async loadSalesTaxRates() {
      try {
        this.salesTaxRates = await SalesTaxService.getAllSalesTax();
      } catch (error) {
        console.error('Error loading sales tax rates:', error);
      }
    },
    async loadShipViaMethods() {
      try {
        this.shipViaMethods = await ShipViaService.getAllShipVia();
      } catch (error) {
        console.error('Error loading shipping methods:', error);
      }
    },

    // METHOD: Update sales tax based on shipping method and address
    updateSalesTax() {
      // Determine which sales tax to use based on shipping method and address
      if (!this.ticket.ship_via_id || !this.shipViaMethods.length) return;

      const selectedShipVia = this.shipViaMethods.find(method => method.id === this.ticket.ship_via_id);
      if (!selectedShipVia) return;

      // If customer is tax exempt, select the "None" tax rate
      if (this.customerIsTaxExempt) {
        const noneTax = this.salesTaxRates.find(tax => tax.name === 'None');
        if (noneTax) {
          this.ticket.sales_tax_id = noneTax.id;
        }
        return;
      }

      // If "Pickup" is selected, use the sawmill's location tax (Gilmer County)
      if (selectedShipVia.name === 'Pickup') {
        // Find Gilmer County sales tax
        const gilmerTax = this.salesTaxRates.find(tax => tax.county === 'Gilmer' && tax.state === 'GA');
        if (gilmerTax) {
          this.ticket.sales_tax_id = gilmerTax.id;
        }
      } else {
        // Otherwise, use the shipping address tax if available
        if (this.ticket.shipping_address_id) {
          const shippingAddress = this.customerAddresses.find(address =>
            address.id === this.ticket.shipping_address_id
          );

          if (shippingAddress && shippingAddress.sales_tax_id) {
            this.ticket.sales_tax_id = shippingAddress.sales_tax_id;
          }
        }
      }

      // Recalculate tax for all items
      this.recalculateTax();
    },

    // METHOD: Recalculate tax for all items
    recalculateTax() {
      // Update tax calculations for all items based on the selected tax rate
      this.ticket.items.forEach((item, index) => {
        this.calculateItemTotal(index);
      });

      // Recalculate totals
      this.calculateTotals();
    }
  },

  created() {
    // Load sales tax rates and shipping methods first
    Promise.all([
      this.loadSalesTaxRates(),
      this.loadShipViaMethods(),
      this.loadAllCustomers() // Load all customers at init
    ]).then(() => {
      // Load species list
      this.loadSpecies();

      // Start with one empty item if not in edit mode
      if (!this.id) {
        this.addItem();
      } else {
        this.loadTicket();
      }
    });
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.customer-info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.addresses {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.shipping-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.hidden {
  display: none;
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-item {
  padding: 8px 12px;
  cursor: pointer;
}

.search-item:hover,
.search-item.active {
  background-color: #f0f7ff;
}

.search-item.active {
  background-color: #e7f1ff;
  border-left: 3px solid #0d6efd;
}

.btn-icon {
  width: 30px;
  height: 30px;
  padding: 0;
  line-height: 1;
  border-radius: 4px;
  font-size: 12px;
}

.totals {
  margin-top: 20px;
  margin-bottom: 20px;
}

.totals-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.flex-spacer {
  flex-grow: 1;
}

.bf-total {
  margin-top: 10px;
  font-weight: bold;
}

.totals-block {
  min-width: 300px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.total-row .label {
  font-weight: bold;
  margin-right: 20px;
}

.freight-input {
  width: 80px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  padding: 2px 5px;
  text-align: right;
}

/* SECTION: TOTALS-SALES TAX */
.tax-select {
  width: 200px;
  display: inline-block;
  padding: 2px 5px;
  height: auto;
  font-size: 0.9rem;
}

.tax-exempt-notice {
  color: #1e7e34;
  font-weight: bold;
  margin-top: 3px;
  font-size: 0.8rem;
}

.actions {
  margin-top: 20px;
}

.actions button {
  margin-right: 10px;
}

.loading,
.error {
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

.tax-exempt-notice {
  color: #1e7e34;
  font-weight: bold;
  margin-top: 5px;
  font-size: 0.9rem;
}

.lumber-dimension {
  min-width: 60px;
  padding-right: 5px;
}

.input-group-text {
  padding: 0.25rem 0.5rem;
  background-color: #f8f9fa;
  font-weight: bold;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

/* Modify the table to be more compact */
.lumber-items .table td {
  padding: 0.4rem;
  vertical-align: middle;
}

.lumber-items .table th {
  padding: 0.5rem 0.4rem;
}

/* Make the form controls in the table more compact */
.lumber-items .form-control-sm {
  height: calc(1.5em + 0.5rem + 2px);
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* Adjust the padding for number inputs */
.lumber-items input[type="number"] {
  padding-right: 0.3rem;
}
</style>