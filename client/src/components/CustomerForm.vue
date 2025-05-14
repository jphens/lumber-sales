<template>
    <div class="customer-form">
        <h2>{{ isEditMode ? 'Edit' : 'New' }} Customer</h2>

        <div v-if="loading" class="loading">
            Loading customer data...
        </div>

        <div v-else-if="error" class="error">
            Error: {{ error }}
        </div>

        <template v-else>
            <!-- Customer Information Section -->
            <div class="form-section">
                <h3>Customer Information</h3>
                <div class="customer-info">
                    <div class="form-group">
                        <label>Customer Number *</label>
                        <input v-model="formData.party_number" class="form-control" :disabled="isEditMode"
                            placeholder="Enter customer number" />
                    </div>
                    <div class="form-group">
                        <label>Customer Name *</label>
                        <input v-model="formData.name" class="form-control" placeholder="Enter customer name" />
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input v-model="formData.email" type="email" class="form-control"
                            placeholder="Enter email address" />
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input v-model="formData.phone" class="form-control" placeholder="Enter phone number" />
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea v-model="formData.notes" class="form-control" rows="2"
                            placeholder="Enter any notes"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tax Status</label>
                        <div class="form-check">
                            <input v-model="formData.sales_tax_exempt" type="checkbox" class="form-check-input"
                                id="taxExempt" />
                            <label class="form-check-label" for="taxExempt">
                                Sales Tax Exempt
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Addresses Section -->
            <div class="form-section">
                <div class="section-header">
                    <h3>Addresses</h3>
                    <button @click="showAddressModal" class="btn btn-primary btn-sm">Add Address</button>
                </div>

                <div v-if="addresses.length === 0" class="no-addresses">
                    No addresses added yet.
                </div>

                <table v-else class="table addresses-table">
                    <thead>
                        <tr>
                            <th>Address Line 1</th>
                            <th>Address Line 2</th>
                            <th>City</th>
                            <th>County</th>
                            <th>State</th>
                            <th>Zip</th>
                            <th>Billing</th>
                            <th>Default Shipping</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(address, index) in addresses" :key="address.tempId || address.id">
                            <td>{{ address.address_line1 }}</td>
                            <td>{{ address.address_line2 || '-' }}</td>
                            <td>{{ address.city }}</td>
                            <td>{{ address.county || '-' }}</td>
                            <td>{{ address.state }}</td>
                            <td>{{ address.postal_code }}</td>
                            <td class="text-center">
                                <input type="radio" name="billing" :checked="address.is_billing"
                                    @change="setBillingAddress(index)" />
                            </td>
                            <td class="text-center">
                                <input type="radio" name="shipping" :checked="address.is_default_shipping"
                                    @change="setDefaultShipping(index)" />
                            </td>
                            <td>
                                <button @click="editAddress(index)" class="btn btn-sm btn-info">Edit</button>
                                <button @click="removeAddress(index)" class="btn btn-sm btn-danger">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Action Buttons -->
            <div class="actions">
                <button @click="saveCustomer" class="btn btn-success" :disabled="saving">
                    {{ saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }} Customer
                </button>
                <button @click="cancel" class="btn btn-secondary">Cancel</button>
            </div>
        </template>

        <!-- Address Modal -->
        <div v-if="showModal" class="modal-backdrop" @click="closeModal">
            <div class="modal-content" @click.stop>
                <h4>{{ editingAddressIndex >= 0 ? 'Edit' : 'Add' }} Address</h4>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Address Line 1 *</label>
                        <input v-model="currentAddress.address_line1" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>Address Line 2</label>
                        <input v-model="currentAddress.address_line2" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>City *</label>
                        <input v-model="currentAddress.city" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>County</label>
                        <input v-model="currentAddress.county" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label>State *</label>
                        <input v-model="currentAddress.state" class="form-control" maxlength="2" />
                    </div>
                    <div class="form-group">
                        <label>Zip Code *</label>
                        <input v-model="currentAddress.postal_code" class="form-control" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="saveAddress" class="btn btn-primary">Save Address</button>
                    <button @click="closeModal" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { CustomerService, PartyService, AddressService } from '../services/api';

export default {
    name: 'CustomerForm',
    props: {
        id: {
            type: [String, Number],
            required: false
        }
    },
    data() {
        return {
            formData: {
                party_number: '',
                name: '',
                email: '',
                phone: '',
                notes: '',
                sales_tax_exempt: false
            },
            addresses: [],
            currentAddress: {
                address_line1: '',
                address_line2: '',
                city: '',
                county: '',
                state: '',
                postal_code: ''
            },
            showModal: false,
            editingAddressIndex: -1,
            isEditMode: false,
            loading: false,
            saving: false,
            error: null,
            customerId: null,
            partyId: null,
            nextTempId: 1
        };
    },
    methods: {
        async loadCustomer() {
            if (!this.id) return;

            this.isEditMode = true;
            this.loading = true;

            try {
                // Load customer with addresses - this method already exists in the API
                const customer = await CustomerService.getCustomerWithAddresses(this.id);

                // Set form data
                this.customerId = customer.id;
                this.partyId = customer.party_id;
                this.formData = {
                    party_number: customer.party_number,
                    name: customer.name,
                    email: customer.email || '',
                    phone: customer.phone || '',
                    notes: customer.notes || '',
                    sales_tax_exempt: customer.sales_tax_exempt === 1
                };

                // Load addresses - the existing API returns them as "allAddresses"
                this.addresses = customer.allAddresses.map(addr => ({
                    ...addr,
                    is_billing: customer.default_billing_address_id === addr.id,
                    is_default_shipping: customer.default_shipping_address_id === addr.id
                }));
            } catch (error) {
                this.error = `Failed to load customer: ${error.message}`;
            } finally {
                this.loading = false;
            }
        },

        showAddressModal() {
            this.currentAddress = {
                address_line1: '',
                address_line2: '',
                city: '',
                county: '',
                state: '',
                postal_code: ''
            };
            this.editingAddressIndex = -1;
            this.showModal = true;
        },

        editAddress(index) {
            this.currentAddress = { ...this.addresses[index] };
            this.editingAddressIndex = index;
            this.showModal = true;
        },

        saveAddress() {
            // Validate required fields
            if (!this.currentAddress.address_line1 || !this.currentAddress.city ||
                !this.currentAddress.state || !this.currentAddress.postal_code) {
                alert('Please fill in all required fields');
                return;
            }

            if (this.editingAddressIndex >= 0) {
                // Update existing address
                this.addresses[this.editingAddressIndex] = {
                    ...this.addresses[this.editingAddressIndex],
                    ...this.currentAddress
                };
            } else {
                // Add new address
                this.addresses.push({
                    ...this.currentAddress,
                    tempId: this.nextTempId++,
                    is_billing: false,
                    is_default_shipping: false
                });
            }

            this.closeModal();
        },

        removeAddress(index) {
            if (confirm('Are you sure you want to remove this address?')) {
                this.addresses.splice(index, 1);
            }
        },

        setBillingAddress(index) {
            // Uncheck all others, then check this one
            this.addresses.forEach((addr, i) => {
                addr.is_billing = i === index;
            });
        },

        setDefaultShipping(index) {
            // Uncheck all others, then check this one
            this.addresses.forEach((addr, i) => {
                addr.is_default_shipping = i === index;
            });
        },

        closeModal() {
            this.showModal = false;
            this.currentAddress = {
                address_line1: '',
                address_line2: '',
                city: '',
                county: '',
                state: '',
                postal_code: ''
            };
            this.editingAddressIndex = -1;
        },

        async saveCustomer() {
            // Validate required fields
            if (!this.formData.party_number || !this.formData.name) {
                alert('Customer number and name are required');
                return;
            }

            this.saving = true;
            try {
                let partyData = {
                    party_number: this.formData.party_number,
                    name: this.formData.name,
                    phone: this.formData.phone,
                    email: this.formData.email,
                    notes: this.formData.notes
                };

                let savedPartyId;
                let savedCustomerId;

                if (this.isEditMode) {
                    // Update existing party
                    await PartyService.updateParty(this.partyId, partyData);
                    savedPartyId = this.partyId;
                    savedCustomerId = this.customerId;

                    // Update customer data
                    await CustomerService.updateCustomer(this.customerId, {
                        sales_tax_exempt: this.formData.sales_tax_exempt
                    });
                } else {
                    // Create new party
                    const newParty = await PartyService.createParty(partyData);
                    savedPartyId = newParty.id;

                    // Create customer
                    const newCustomer = await CustomerService.createCustomer({
                        party_id: savedPartyId,
                        sales_tax_exempt: this.formData.sales_tax_exempt
                    });
                    savedCustomerId = newCustomer.id;
                }

                // Process addresses
                for (const address of this.addresses) {
                    let addressId;

                    if (address.id && !address.tempId) {
                        // Update existing address
                        await AddressService.updateAddress(address.id, {
                            address_line1: address.address_line1,
                            address_line2: address.address_line2,
                            city: address.city,
                            county: address.county,
                            state: address.state,
                            postal_code: address.postal_code
                        });
                        addressId = address.id;
                    } else {
                        // Create new address
                        const newAddress = await AddressService.createAddress({
                            address_line1: address.address_line1,
                            address_line2: address.address_line2,
                            city: address.city,
                            county: address.county,
                            state: address.state,
                            postal_code: address.postal_code
                        });
                        addressId = newAddress.id;

                        // Associate with party
                        await AddressService.associateWithParty(savedPartyId, addressId, 'both', false);
                    }

                    // Update billing/shipping defaults
                    if (address.is_billing || address.is_default_shipping) {
                        const updates = {};
                        if (address.is_billing) updates.default_billing_address_id = addressId;
                        if (address.is_default_shipping) updates.default_shipping_address_id = addressId;

                        await CustomerService.updateCustomer(savedCustomerId, updates);
                    }
                }

                alert('Customer saved successfully!');
                this.$router.push('/customers');
            } catch (error) {
                alert(`Failed to save customer: ${error.message}`);
            } finally {
                this.saving = false;
            }
        },

        cancel() {
            this.$router.push('/customers');
        }
    },

    created() {
        if (this.id) {
            this.loadCustomer();
        }
    }
};
</script>

<style scoped>
.customer-form {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.form-section {
    margin-bottom: 30px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    background-color: #f8f9fa;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.customer-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-control {
    width: 100%;
}

.addresses-table {
    background-color: white;
}

.addresses-table th {
    background-color: #f1f3f4;
    font-weight: bold;
}

.no-addresses {
    text-align: center;
    padding: 20px;
    color: #666;
}

.actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
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

/* Modal Styles */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    width: 500px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-body {
    margin: 20px 0;
}

.modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.text-center {
    text-align: center;
}
</style>