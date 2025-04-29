<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" href="#">Lumber Sales</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav mr-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/new">New Ticket</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/list">View Tickets</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="container mt-4">
      <router-view/>
    </div>
  </div>
</template>

<style>
@media print {
  nav {
    display: none;
  }
}
</style>