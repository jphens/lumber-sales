<template>
    <div class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p v-if="message" class="loading-message">{{ message }}</p>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LoadingIndicator',
    props: {
      message: {
        type: String,
        default: 'Loading...'
      }
    }
  }
  </script>
  
  <style scoped>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .loading-message {
    margin-top: 10px;
    color: #6c757d;
  }
  </style>