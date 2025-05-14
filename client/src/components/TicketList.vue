<template>
  <div class="ticket-list">
    <h2>Saved Tickets</h2>

    <div v-if="loading" class="loading">
      Loading tickets...
    </div>

    <div v-else-if="error" class="error">
      Error loading tickets: {{ error }}
    </div>

    <template v-else>
      <div class="filters mb-3">
        <div class="row">
          <div class="col-md-6">
            <input type="text" v-model="searchTerm" class="form-control" placeholder="Search by customer name..."
              @input="filterTickets" />
          </div>
          <!-- <div class="col-md-3">
            <select v-model="statusFilter" class="form-control" @change="filterTickets">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </select>
          </div> -->
          <div class="col-md-3">
            <button @click="loadTickets" class="btn btn-primary">Refresh</button>
          </div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <!-- <th>Status</th> -->
            <th>Board Feet</th>
            <th>Items</th> <!-- NEW COLUMN -->
            <th>Subtotal</th>
            <th>Tax</th>
            <th>Freight</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in filteredTickets" :key="ticket.id">
            <td>{{ ticket.invoice_number }}</td>
            <td>{{ formatDate(ticket.date) }}</td>
            <td>{{ ticket.customerName }}</td>
            <!-- <td>
              <span :class="getStatusClass(ticket.status)">
                {{ capitalize(ticket.status || 'Draft') }}
              </span>
            </td> -->
            <td>{{ formatNumber(ticket.total_bf) }}</td>
            <td>{{ ticket.distribution_total || 0 }}</td> <!-- NEW CELL -->
            <td>${{ formatCurrency(ticket.total_amount) }}</td>
            <td>${{ formatCurrency(ticket.total_tax) }}</td>
            <td>${{ formatCurrency(ticket.total_freight) }}</td>
            <td>${{ formatCurrency(Number(ticket.total_amount) + Number(ticket.total_tax) + Number(ticket.total_freight)) }}</td>
            <td>
              <button @click="editTicket(ticket.id)" class="btn btn-primary btn-sm">Edit</button>
              <button @click="printTicket(ticket.id)" class="btn btn-info btn-sm">Print</button>
              <button @click="deleteTicket(ticket.id)" class="btn btn-danger btn-sm">X</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredTickets.length === 0" class="no-tickets">
        {{ tickets.length === 0 ? 'No tickets saved yet.' : 'No tickets match your search criteria.' }}
      </div>
    </template>
  </div>
</template>

<script>
import { TicketService } from '../services/api';

export default {
  data() {
    return {
      tickets: [],
      filteredTickets: [],
      loading: true,
      error: null,
      searchTerm: '',
      statusFilter: ''
    };
  },
  methods: {
    async loadTickets() {
      this.loading = true;
      this.error = null;

      try {
        this.tickets = await TicketService.getAllTickets();
        this.filterTickets();
      } catch (error) {
        this.error = error.message;
        console.error('Error loading tickets:', error);
      } finally {
        this.loading = false;
      }
    },
    filterTickets() {
      this.filteredTickets = this.tickets.filter(ticket => {
        // Filter by customer name
        const nameMatch = !this.searchTerm ||
          (ticket.customerName &&
            ticket.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()));

        // Filter by status
        const statusMatch = !this.statusFilter ||
          (ticket.status && ticket.status === this.statusFilter);

        return nameMatch && statusMatch;
      });
    },
    editTicket(id) {
      this.$router.push(`/edit/${id}`);
    },
    printTicket(id) {
      this.$router.push(`/print/${id}`);
    },
    async deleteTicket(id) {
      if (confirm('Are you sure you want to delete this ticket?')) {
        try {
          await TicketService.deleteTicket(id);
          // Reload the tickets after deletion
          this.loadTickets();
        } catch (error) {
          alert(`Failed to delete ticket: ${error.message}`);
        }
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    formatNumber(value) {
      return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      // return Number(value || 0).toFixed(0);
    },
    formatCurrency(value) {
      return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      // return Number(value || 0).toFixed(2);
    },
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    getStatusClass(status) {
      const classes = {
        draft: 'badge bg-secondary',
        final: 'badge bg-primary',
        paid: 'badge bg-success',
        void: 'badge bg-danger'
      };
      return classes[status] || classes.draft;
    }
  },
  created() {
    this.loadTickets();
  }
};
</script>

<style>
.ticket-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.no-tickets {
  text-align: center;
  margin-top: 20px;
  color: #666;
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

.badge {
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
}

.bg-secondary {
  background-color: #6c757d;
}

.bg-primary {
  background-color: #007bff;
}

.bg-success {
  background-color: #28a745;
}

.bg-danger {
  background-color: #dc3545;
}
</style>