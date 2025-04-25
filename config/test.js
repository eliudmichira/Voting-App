/**
 * Test environment configuration
 * Extends the default configuration with test-specific settings
 */

module.exports = {
  // Server configuration
  server: {
    port: 8081, // Different port to avoid conflicts with development
    host: 'localhost'
  },

  // Database configuration
  database: {
    url: 'mongodb://localhost:27017/voting-app-test'
  },

  // Blockchain configuration
  blockchain: {
    network: 'test',
    provider: 'http://localhost:8545',
    gas: {
      limit: 5000000,
      price: '20000000000' // 20 Gwei
    }
  },

  // Authentication configuration
  auth: {
    jwtSecret: 'test-secret-key',
    jwtExpiration: '1h'
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
    level: 'error',
    file: 'logs/test.log'
  }
}; 