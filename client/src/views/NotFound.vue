<template>
    <div class="not-found">
      <h1>Page Not Found</h1>
      <p>The page you were looking for does not exist.</p>
      <router-link to="/" class="btn btn-primary">Go to Home</router-link>
    </div>
  </template>
  
  <script>
  export default {
    name: 'NotFoundPage'
  }
  </script>
  
  <style scoped>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    min-height: 50vh;
    text-align: center;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 2rem;
    color: #6c757d;
  }
  </style>