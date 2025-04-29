<template>
    <div class="error-container alert alert-danger" role="alert">
      <div v-if="title" class="error-title">{{ title }}</div>
      <div class="error-message">{{ message }}</div>
      <button v-if="retryButton" @click="$emit('retry')" class="btn btn-outline-danger mt-2">
        Try Again
      </button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ErrorMessage',
    props: {
      title: {
        type: String,
        default: ''
      },
      message: {
        type: String,
        required: true
      },
      retryButton: {
        type: Boolean,
        default: false
      }
    },
    emits: ['retry']
  }
  </script>
  
  <style scoped>
  .error-container {
    margin: 20px 0;
    padding: 15px;
    border-radius: 4px;
  }
  
  .error-title {
    font-weight: bold;
    margin-bottom: 5px;
  }
  </style>