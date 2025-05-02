<template>
  <div class="print-ticket">
    <div v-if="loading" class="loading d-print-none">
      Loading ticket data...
    </div>
    
    <div v-else-if="error" class="error d-print-none">
      Error: {{ error }}
    </div>
    
    <template v-else>
      <div class="print-controls d-print-none">
        <button @click="goBack" class="btn btn-secondary">Back</button>
        <button @click="print" class="btn btn-primary ml-2">Print</button>
      </div>
      
      <div class="ticket-container">
        <div class="company-header">
          <h1>Lumber Sales Receipt</h1>
          <p>{{ companyInfo.name }}</p>
          <p>{{ companyInfo.address }}</p>
          <p>Phone: {{ companyInfo.phone }}</p>
        </div>
        
        <div class="ticket-details">
          <div class="row">
            <div class="col-md-6">
              <strong>Customer:</strong> {{ ticket.customerName }}<br>
              <strong>Phone:</strong> {{ ticket.customerPhone }}
              
              <div v-if="billingAddress" class="mt-2">
                <strong>Billing Address:</strong><br>
                <div v-for="(line, index) in formatAddressMultiLine(billingAddress)" :key="`billing-${index}`">
                  {{ line }}
                </div>
              </div>
            </div>
            <div class="col-md-6 text-right">
              <strong>Invoice #:</strong> {{ ticket.invoice_number }}<br>
              <strong>Ticket #:</strong> {{ ticket.id }}<br>
              <strong>Date:</strong> {{ formatDate(ticket.date) }}<br>
              <strong>Status:</strong> {{ capitalize(ticket.status) }}<br>
              <strong>Ship Via:</strong> {{ ticket.ship_via_name || 'Not specified' }}
              
              <div v-if="shippingAddress" class="mt-2">
                <strong>Shipping Address:</strong><br>
                <div v-for="(line, index) in formatAddressMultiLine(shippingAddress)" :key="`shipping-${index}`">
                  {{ line }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="lumber-items mt-4">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Species</th>
                <th>Qty</th>
                <th>Dimensions (inches)</th>
                <th>Length (ft)</th>
                <th>Board Feet</th>
                <th>Price/MBF</th>
                <th>Amount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ticket.items" :key="index">
                <td>{{ getSpeciesName(item) }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.thickness }} x {{ item.width }}</td>
                <td>{{ item.length }}</td>
                <td>{{ formatNumber(item.total_bf) }}</td>
                <td>${{ formatCurrency(item.price_per_mbf) }}</td>
                <td>${{ formatCurrency(item.total_amount) }}</td>
                <td>${{ formatCurrency(item.tax_amount || 0) }}</td>
                <td>${{ formatCurrency(Number(item.total_amount) + Number(item.tax_amount)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="totals mt-4">
          <div class="row">
            <div class="col-md-6 offset-md-6">
              <table class="table table-bordered">
                <tbody>
                  <tr>
                    <th>Subtotal:</th>
                    <td>${{ formatCurrency(ticket.total_amount) }}</td>
                  </tr>
                  <tr>
                    <th>Tax ({{ formatTaxInfo() }}):</th>
                    <td>${{ formatCurrency(ticket.total_tax) }}</td>
                  </tr>
                  <tr>
                    <th>Total:</th>
                    <td>${{ formatCurrency(Number(ticket.total_amount) + Number(ticket.total_tax)) }}</td>
                  </tr>
                  <tr>
                    <th>Total Board Feet:</th>
                    <td>{{ formatNumber(ticket.total_bf) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="footer mt-5">
          <p><em>Balance is due in 30-days from the invoice date. Past due balances are subject to a late payment charge of up to 1.5% per month, or 18% per year</em></p>
          <p><em>Thank you for your business!</em></p>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { TicketService } from '../services/api';
import config from '../config';

export default {
  name: 'PrintTicket',
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      ticket: {
        id: '',
        invoice_number: null,
        customerName: '',
        customerPhone: '',
        date: '',
        status: 'draft',
        ship_via_name: '',
        ship_via_description: '',
        sales_tax_name: '',
        sales_tax_rate: 0,
        items: [],
        total_bf: 0,
        total_tax: 0,
        total_amount: 0
      },
      billingAddress: null,
      shippingAddress: null,
      companyInfo: config.company,
      loading: true,
      error: null
    };
  },
  methods: {
    async loadTicket() {
      this.loading = true;
      
      try {
        this.ticket = await TicketService.getTicket(this.id);
        
        if (!this.ticket) {
          this.error = 'Ticket not found!';
          this.$router.push('/list');
          return;
        }
        
        // Extract billing and shipping addresses
        if (this.ticket.billingAddress1) {
          this.billingAddress = {
            address_line1: this.ticket.billingAddress1,
            address_line2: this.ticket.billingAddress2,
            city: this.ticket.billingCity,
            state: this.ticket.billingState,
            county: this.ticket.billingCounty,
            postal_code: this.ticket.billingPostalCode
          };
        }
        
        if (this.ticket.shippingAddress1) {
          this.shippingAddress = {
            address_line1: this.ticket.shippingAddress1,
            address_line2: this.ticket.shippingAddress2,
            city: this.ticket.shippingCity,
            state: this.ticket.shippingState,
            county: this.ticket.shippingCounty,
            postal_code: this.ticket.shippingPostalCode
          };
        }
      } catch (error) {
        this.error = `Failed to load ticket: ${error.message}`;
        console.error('Error loading ticket:', error);
      } finally {
        this.loading = false;
      }
    },
    calculateSubtotal() {
      // Since total_amount now represents the base amount (not including tax),
      // we can just return it directly
      return this.ticket.total_amount;
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    formatNumber(value) {
      return Number(value || 0).toFixed(2);
    },
    formatCurrency(value) {
      return Number(value || 0).toFixed(2);
    },
    formatTaxInfo() {
      if (this.ticket.sales_tax_name) {
        const taxRate = (Number(this.ticket.sales_tax_rate || 0) * 100).toFixed(2);
        return `${this.ticket.sales_tax_name} ${taxRate}%`;
      }
      return this.ticket.total_tax > 0 ? 'Sales Tax' : 'Tax Exempt';
    },
    formatAddressMultiLine(address) {
      if (!address) return [];
      
      const lines = [
        address.address_line1
      ];
      
      if (address.address_line2) {
        lines.push(address.address_line2);
      }
      
      let cityLine = `${address.city}, ${address.state} ${address.postal_code}`;
      if (address.county) {
        cityLine = `${address.city}, ${address.county} County, ${address.state} ${address.postal_code}`;
      }
      lines.push(cityLine);
      
      if (address.country && address.country !== 'USA') {
        lines.push(address.country);
      }
      
      return lines;
    },
    getSpeciesName(item) {
      return item.speciesListName || item.speciesName || 'Unknown Species';
    },
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    print() {
      window.print();
    },
    goBack() {
      this.$router.push('/list');
    }
  },
  created() {
    this.loadTicket();
  }
};
</script>

<style>
.print-ticket {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.print-controls {
  margin-bottom: 20px;
}

.company-header {
  text-align: center;
  margin-bottom: 30px;
}

.company-header p {
  margin: 0;
}

.ticket-details {
  margin-bottom: 20px;
}

.footer {
  text-align: center;
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
  .print-controls, .loading, .error {
    display: none;
  }
  
  body {
    font-size: 12pt;
  }
  
  .print-ticket {
    padding: 0;
  }
}
</style>