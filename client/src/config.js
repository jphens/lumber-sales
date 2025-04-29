/**
 * Application configuration
 */

// Determine if running in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Detect if running locally or on the network
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

/**
 * Select the appropriate API URL based on environment and location
 * If environment variable is set, use that
 * Otherwise, use local URL when accessed from localhost,
 * or the network IP when accessed from another device
 */
const getApiUrl = () => {
  if (process.env.VUE_APP_API_URL) {
    return process.env.VUE_APP_API_URL;
  }
  
  if (isLocalhost) {
    return 'http://localhost:3000/api';
  } if (isDevelopment){
    // Currently just the same as "else" so that variable is in use and doesn't throw error
    return 'http://192.168.1.117:3000/api';
  } else {
    // Your server's network IP
    return 'http://192.168.1.117:3000/api';
  }
};

const config = {
  // API base URL
  apiUrl: getApiUrl(),
  
  // Company information (for receipts)
  company: {
    name: 'Sparks Lumber Company, Inc.',
    address: 'PO Box 831, ELLIJAY, GA 30540',
    phone: '(706) 678-4047'
  }
};

export default config;