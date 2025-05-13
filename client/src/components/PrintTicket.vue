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
        <!-- TOP SECTION: Header with company and customer info -->
        <div class="header-section">
          <div class="header-left">
            <!-- Company Info -->
            <div class="company-info">
              <h1 class="company-name">{{ companyInfo.name }}</h1>
              <p>{{ companyInfo.address }}</p>
              <p>{{ companyInfo.phone }}</p>
            </div>

            <!-- Sold To Info -->
            <div class="sold-to">
              <strong>Sold To:</strong>
              <div class="customer-details">
                <p>{{ ticket.customerName }}</p>
                <div v-if="billingAddress">
                  <p>{{ billingAddress.address_line1 }}</p>
                  <p v-if="billingAddress.address_line2">{{ billingAddress.address_line2 }}</p>
                  <p>{{ formatCityStateZip(billingAddress) }}</p>
                </div>
                <p>{{ ticket.customerPhone }}</p>
              </div>
            </div>
          </div>

          <div class="header-right">
            <!-- Page and Ticket Info -->
            <div class="ticket-info">
              <p>Page: 1</p>
              <p>Number: {{ ticket.invoice_number || 'DRAFT' }}</p>
              <p>Date: {{ formatDate(ticket.date) }}</p>
            </div>

            <!-- Ship To Info -->
            <div class="ship-to">
              <strong>Ship To:</strong>
              <div class="shipping-details">
                <div v-if="shippingAddress">
                  <p>{{ ticket.customerName }}</p>
                  <p v-if="ticket.shipping_attention">Attention: {{ ticket.shipping_attention }}</p>
                  <p>{{ shippingAddress.address_line1 }}</p>
                  <p v-if="shippingAddress.address_line2">{{ shippingAddress.address_line2 }}</p>
                  <p>{{ formatCityStateZip(shippingAddress) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Details Row -->
        <div class="order-details-row">
          <div class="detail-item">
            <span class="detail-label">Customer Order No:</span>
            <span class="detail-value">{{ ticket.purchase_order || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <!-- <span class="detail-label">Type:</span> -->
            <!-- <span class="detail-value">{{ ticket.ticket_type.toUpperCase() }}</span> -->
          </div>
          <div class="detail-item">
            <!-- <span class="detail-label">Status:</span> -->
            <!-- <span class="detail-value">{{ ticket.status.toUpperCase() }}</span> -->
          </div>
          <div class="detail-item">
            <!-- <span class="detail-label">Ship Via:</span> -->
            <!-- <span class="detail-value">{{ ticket.ship_via_name || 'N/A' }}</span> -->
          </div>
        </div>

        <!-- MIDDLE SECTION: Line Items Table -->
        <div class="line-items-section">
          <table class="items-table">
            <!-- TABLE HEADERS -->
            <thead>
              <tr>
                <th>Number/Desc</th>
                <th class="qty">Qty</th>
                <th class="dimensions">Dimensions</th>
                <th class="board-feet">Board Ft</th>
                <th class="price">Price</th>
                <th class="ext">Ext</th>
              </tr>
            </thead>
            <!-- TABLE BODY -->
            <tbody>
              <tr v-for="(item, index) in ticket.items" :key="index">
                <td class="species">{{ getSpeciesNumber(item) }}−{{ getSpeciesName(item) }}</td>
                <td class="qty">{{ item.quantity }}</td>
                <td class="dimensions">
                  <span class="dimension-value">{{ formatDecimal(item.thickness) }}</span>
                  <span class="dimension-separator">x</span>
                  <span class="dimension-value">{{ formatDecimal(item.width) }}</span>
                  <span class="dimension-separator">x</span>
                  <span class="dimension-value">{{ formatDecimal(item.length) }}</span>
                </td>
                <td class="board-feet">{{ formatNumber(item.total_bf) }}</td>
                <td class="price">{{ formatMoney(item.price_per_mbf) }}</td>
                <td class="ext">{{ formatMoney(item.total_amount) }}</td>
              </tr>
            </tbody>
            <!-- TABLE FOOTER -->
            <tfoot>
              <tr>
                <th></th>
                <th class="qty"></th>
                <!-- <th class="dimensions-footer">Total BF: </th> -->
                <th class="dimensions-footer"></th>
                <th class="board-feet">{{ formatNumber(ticket.total_bf) }}</th>
                <th class="price"></th>
                <th class="ext">{{ formatMoney(ticket.total_amount) }}</th>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- BOTTOM SECTION: Totals -->
        <div class="totals-section">
          <div class="totals-grid">
            <div class="totals-label">
              <!-- <p>Subtotal</p> -->
              <p>Sales Tax</p>
              <p>Freight</p>
            </div>
            <!-- <div class="totals-column board-feet-total">
              <p>{{ formatNumber(ticket.total_bf) }}</p>
            </div> -->
            <div class="totals-column amount-total">
              <!-- <p>{{ formatMoney(ticket.total_amount) }}</p> -->
              <p>{{ formatMoney(ticket.total_tax) }}</p>
              <p>{{ formatMoney(ticket.total_freight) }}</p>
              <p class="total-line">{{ formatMoney(calculateGrandTotal()) }}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-section">
          <div class="signature-blocks">
            <div class="signature-block">
              <p>RECEIVED BY ___________________</p>
            </div>
            <div class="signature-block">
              <p>DELIVERED BY ___________________</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { TicketService, SpeciesService } from '../services/api';
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
        due_date: '',
        ticket_type: 'invoice',
        purchase_order: '',
        shipping_attention: '',
        total_freight: 0,
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
      speciesList: [],
      loading: true,
      error: null
    };
  },
  methods: {
    async loadTicket() {
      this.loading = true;

      try {
        const [ticket, speciesList] = await Promise.all([
          TicketService.getTicket(this.id),
          SpeciesService.getAllSpecies()
        ]);

        if (!ticket) {
          this.error = 'Ticket not found!';
          this.$router.push('/list');
          return;
        }

        this.ticket = ticket;
        this.speciesList = speciesList;

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

        // Set due date to 30 days after ticket date if not provided
        if (!this.ticket.due_date) {
          const ticketDate = new Date(this.ticket.date);
          ticketDate.setDate(ticketDate.getDate() + 30);
          this.ticket.due_date = ticketDate.toISOString().split('T')[0];
        }
      } catch (error) {
        this.error = `Failed to load ticket: ${error.message}`;
        console.error('Error loading ticket:', error);
      } finally {
        this.loading = false;
      }
    },
    calculateGrandTotal() {
      return Number(this.ticket.total_amount) +
        Number(this.ticket.total_tax) +
        Number(this.ticket.total_freight);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    },
    formatNumber(value) {
      return Number(value || 0).toFixed(0);
    },
    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },
    formatCityStateZip(address) {
      if (!address) return '';
      let line = `${address.city}, ${address.state} ${address.postal_code}`;
      if (address.county) {
        line = `${address.city}, ${address.county}, ${address.state} ${address.postal_code}`;
      }
      return line;
    },
    formatDimensions(item) {
      const thickness = Number(item.thickness).toFixed(2);
      const width = Number(item.width).toFixed(2);
      const length = Number(item.length).toFixed(2);

      // Create fixed-width strings for alignment
      const thicknessStr = thickness.padStart(5, ' ');
      const widthStr = width.padStart(5, ' ');
      const lengthStr = length.padStart(5, ' ');

      return `${thicknessStr} X ${widthStr} X ${lengthStr}`;
    },
    formatDecimal(value) {
      // Format number to always show 2 decimal places
      return Number(value).toFixed(2);
    },
    getSpeciesName(item) {
      // Try to find the species from the loaded species list
      if (this.speciesList.length > 0 && item.species_id) {
        const species = this.speciesList.find(s => s.id === item.species_id);
        if (species) {
          return species.name;
        }
      }
      // Fallback to data from the item
      return item.speciesName || 'Unknown Species';
    },
    getSpeciesNumber(item) {
      // Try to find the species from the loaded species list
      if (this.speciesList.length > 0 && item.species_id) {
        const species = this.speciesList.find(s => s.id === item.species_id);
        if (species) {
          return species.species_number.padStart(3, '0');
        }
      }
      // Fallback to default
      return '000';
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
  font-family: 'Courier New', monospace;
}

@media screen {
  .print-controls {
    margin-bottom: 20px;
    padding: 20px 0;
  }
}

.ticket-container {
  padding: 20px;
  background: white;
  font-size: 10pt;
  line-height: 1.2;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 9pt;
}

.header-left,
.header-right {
  width: 48%;
}

.company-name {
  font-size: 14pt;
  font-weight: bold;
  margin: 0 0 3px 0;
}

.company-info p,
.ticket-info p,
.customer-details p,
.shipping-details p {
  margin: 1px 0;
  white-space: nowrap;
  overflow: hidden;
}

.company-info {
  margin-bottom: 15px;
}

.sold-to,
.ship-to {
  margin-top: 8px;
}

.sold-to strong,
.ship-to strong {
  display: block;
  margin-bottom: 3px;
}

.ticket-info {
  text-align: right;
  margin-bottom: 15px;
}

/* Order Details Row */
.order-details-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 5px 0px 0px;
  font-size: 9pt;
}

.detail-item {
  white-space: nowrap;
}

.detail-label {
  font-weight: bold;
  margin-right: 3px;
}

.detail-value {
  text-transform: uppercase;
}

/* Line Items Section */
.line-items-section {
  margin: 15px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}

.items-table th {
  /* border-top: 1px solid #000;
  border-bottom: 1px solid #000; */
  padding: 3px 5px;
  text-align: left;
  font-weight: normal;
}

.items-table td {
  padding: 2px 5px;
  vertical-align: top;
}

.items-table .species {
  width: 150px;
  margin: 0px 2px;
  /* border-right: #000 1px solid; */
}

.items-table .qty {
  text-align: center;
  max-width: 40px;
  padding-right: 20px;
  /* border-right: #000 1px solid; */
}

.items-table .board-feet,
.items-table .price,
.items-table .ext {
  text-align: right;
  width: 70px;
}

.items-table .dimensions {
  width: 180px;
  font-family: 'Courier New', monospace;
  text-align: center;
  white-space: nowrap;
}

.dimension-value {
  display: inline-block;
  width: 35px;
  text-align: right;
}

.dimension-separator {
  display: inline-block;
  width: 10px;
  text-align: center;
  padding: 0px 20px;
}

.tfooter {
  border-top: none
}

.items-table .dimensions-footer {
  text-align: right;
  font-weight: bold;
  padding-right: 20px;
}

/* Totals Section */
.totals-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.totals-grid {
  display: flex;
  gap: 30px;
  font-size: 9pt;
  /* border: #000 1px solid; */
}

.totals-label {
  text-align: right;
  /* border: #000 1px solid; */
}

.totals-label p {
  margin: 1px 0;
  font-weight: bold;
}

.totals-column {
  text-align: right;
  min-width: 80px;
  /* border: #000 1px solid; */
}

.totals-column p {
  margin: 1px 0;
}

.board-feet-total {
  position: relative;
  top: -20px;
  border-top: 1px solid #000;
  padding-top: 2px;
}

.amount-total {
  border-top: 1px solid #000;
  padding-top: 2px;
}

.total-line {
  border-top: 1px solid #000;
  padding-top: 2px;
  font-weight: bold;
}

/* Footer Section */
.footer-section {
  margin-top: 40px;
}

.signature-blocks {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

.signature-block {
  width: 40%;
}

.signature-block p {
  margin: 25px 0 0 0;
  font-size: 9pt;
}

/* Line Items Section */
.line-items-section {
  margin: 20px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}

.items-table th {
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 5px;
  text-align: left;
  font-weight: normal;
}

.items-table td {
  padding: 3px 5px;
  vertical-align: top;
}

.items-table .qty,
.items-table .board-feet,
.items-table .price,
.items-table .ext {
  text-align: right;
  width: 70px;
}

.items-table .dimensions {
  width: 120px;
}

/* TOTALS SECTION CSS */
.totals-section {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

.totals-grid {
  display: flex;
  gap: 30px;
  font-size: 9pt;
}

.totals-label {
  text-align: right;
}

.totals-label p {
  margin: 2px 0;
  font-weight: bold;
}

.totals-column {
  text-align: right;
  min-width: 80px;
}

.totals-column p {
  margin: 2px 0;
}

.board-feet-total {
  position: relative;
  top: -30px;
  border-top: 1px solid #000;
  padding-top: 3px;
}

.amount-total {
  border-top: 1px solid #000;
  padding-top: 3px;
}

.total-line {
  border-top: 1px solid #000;
  padding-top: 3px;
  font-weight: bold;
}

/* Footer Section */
.footer-section {
  margin-top: 50px;
}

.signature-blocks {
  display: flex;
  justify-content: space-between;
  margin-top: 50px;
}

.signature-block {
  width: 40%;
}

.signature-block p {
  margin: 30px 0 0 0;
  font-size: 9pt;
}

/* Print Styles */
@media print {

  .print-controls,
  .loading,
  .error {
    display: none;
  }

  .print-ticket {
    padding: 0;
    margin: 0;
  }

  .ticket-container {
    padding: 0;
    font-size: 10pt;
  }

  body {
    font-family: 'Courier New', monospace;
  }

  .header-section {
    page-break-inside: avoid;
  }

  .line-items-section {
    page-break-inside: avoid;
  }

  .totals-section {
    page-break-inside: avoid;
  }
}
</style>