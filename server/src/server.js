const app = require('./app');

// Set default port or use environment variable
const PORT = process.env.PORT || 3000;
// Listen on all network interfaces (0.0.0.0) instead of just localhost
const HOST = process.env.HOST || '0.0.0.0';

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`API available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
  console.log(`For network access, use http://192.168.1.117:${PORT}/api`);
});