/**
 * Development environment configuration
 * Extends the default configuration with development-specific settings
 */

module.exports = {
  // Server configuration
  server: {
    port: 8080,
    host: 'localhost'
  },

  // Database configuration
  database: {
    url: 'mongodb://localhost:27017/voting-app-dev'
  },

  // Blockchain configuration
  blockchain: {
    network: 'development',
    provider: 'http://localhost:8545',
    gas: {
      limit: 5000000,
      price: '20000000000' // 20 Gwei
    }
  },

  // Application settings
  app: {
    debugMode: true,
    theme: {
      defaultTheme: 'light'
    }
  },

  // Logging configuration
  logging: {
    level: 'debug',
    file: 'logs/development.log'
  }
}; 