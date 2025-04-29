<template>
  <div class="home">
    <div class="jumbotron">
      <h1>Lumber Sales Ticket System</h1>
      <p class="lead">
        Create, manage, and print dimensional lumber sales tickets quickly and efficiently.
      </p>
      <hr class="my-4">
      <p>
        This application helps you calculate board feet and pricing for dimensional lumber sales.
      </p>
      <div class="actions">
        <router-link to="/new" class="btn btn-primary btn-lg">
          Create New Ticket
        </router-link>
        <router-link to="/list" class="btn btn-secondary btn-lg ml-3">
          View Saved Tickets
        </router-link>
      </div>
    </div>

    <div class="row mt-5">
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Create Tickets</h5>
            <p class="card-text">
              Quickly create sales tickets with customer information and lumber dimensions.
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Calculate Board Feet</h5>
            <p class="card-text">
              Automatically calculate board feet and pricing based on lumber dimensions.
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Print Receipts</h5>
            <p class="card-text">
              Generate printable sales receipts for your customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.home {
  max-width: 1000px;
  margin: 0 auto;
}

.jumbotron {
  background-color: #f8f9fa;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 0.3rem;
}

.actions {
  margin-top: 1.5rem;
}

.card {
  height: 100%;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>