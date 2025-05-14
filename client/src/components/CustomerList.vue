<template>
    <div class="customer-list">
        <div class="header">
            <h2>Customer Management</h2>
            <button @click="createNewCustomer" class="btn btn-primary">Add New Customer</button>
        </div>

        <div v-if="loading" class="loading">
            Loading customers...
        </div>

        <div v-else-if="error" class="error">
            Error loading customers: {{ error }}
        </div>

        <template v-else>
            <div class="filters mb-3">
                <div class="row">
                    <div class="col-md-6">
                        <input type="text" v-model="searchTerm" class="form-control"
                            placeholder="Search by name, number, or email..." @input="filterCustomers" />
                    </div>
                    <div class="col-md-3">
                        <select v-model="taxFilter" class="form-control" @change="filterCustomers">
                            <option value="">All Customers</option>
                            <option value="exempt">Tax Exempt</option>
                            <option value="taxable">Taxable</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button @click="loadCustomers" class="btn btn-primary">Refresh</button>
                    </div>
                </div>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th>Number</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Tax Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="customer in filteredCustomers" :key="customer.id">
                        <td>{{ customer.party_number }}</td>
                        <td>{{ customer.name }}</td>
                        <td>{{ customer.email || 'N/A' }}</td>
                        <td>{{ customer.phone || 'N/A' }}</td>
                        <td>
                            <span :class="getTaxStatusClass(customer.sales_tax_exempt)">
                                {{ customer.sales_tax_exempt ? 'Exempt' : 'Taxable' }}
                            </span>
                        </td>
                        <td>
                            <button @click="editCustomer(customer)" class="btn btn-primary btn-sm">Edit</button>
                            <button @click="deleteCustomer(customer)" class="btn btn-danger btn-sm">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-if="filteredCustomers.length === 0" class="no-customers">
                {{ customers.length === 0 ? 'No customers added yet.' : 'No customers match your search criteria.' }}
            </div>
        </template>
    </div>
</template>

<script>
import { CustomerService, PartyService } from '../services/api';

export default {
    name: 'CustomerList',
    data() {
        return {
            customers: [],
            filteredCustomers: [],
            loading: true,
            error: null,
            searchTerm: '',
            taxFilter: ''
        };
    },
    methods: {
        async loadCustomers() {
            this.loading = true;
            this.error = null;

            try {
                // Get all customers with their party information
                this.customers = await CustomerService.getAllCustomers();
                this.filterCustomers();
            } catch (error) {
                this.error = error.message;
                console.error('Error loading customers:', error);
            } finally {
                this.loading = false;
            }
        },

        filterCustomers() {
            this.filteredCustomers = this.customers.filter(customer => {
                // Filter by search term
                const searchMatch = !this.searchTerm ||
                    customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    customer.party_number.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    (customer.email && customer.email.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                    (customer.phone && customer.phone.toLowerCase().includes(this.searchTerm.toLowerCase()));

                // Filter by tax status
                const taxMatch = !this.taxFilter ||
                    (this.taxFilter === 'exempt' && customer.sales_tax_exempt) ||
                    (this.taxFilter === 'taxable' && !customer.sales_tax_exempt);

                return searchMatch && taxMatch;
            });
        },

        createNewCustomer() {
            this.$router.push('/customers/new');
        },

        editCustomer(customer) {
            this.$router.push(`/customers/edit/${customer.id}`);
        },

        async deleteCustomer(customer) {
            if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
                try {
                    await CustomerService.deleteCustomer(customer.id);
                    // Also delete the party
                    await PartyService.deleteParty(customer.party_id);
                    this.loadCustomers();
                } catch (error) {
                    alert(`Failed to delete customer: ${error.message}`);
                }
            }
        },

        getTaxStatusClass(isExempt) {
            return isExempt ? 'badge bg-success' : 'badge bg-warning';
        }
    },

    created() {
        this.loadCustomers();
    }
};
</script>

<style scoped>
.customer-list {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.no-customers {
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

.bg-success {
    background-color: #28a745;
}

.bg-warning {
    background-color: #ffc107;
    color: black;
}

.filters {
    margin-bottom: 20px;
}
</style>