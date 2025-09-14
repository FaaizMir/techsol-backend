const config = require('../config/index');

module.exports = {
  info: (...messages) => console.log(`[INFO] ${new Date().toISOString()}:`, ...messages),
  error: (...messages) => console.error(`[ERROR] ${new Date().toISOString()}:`, ...messages),
};