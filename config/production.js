/**
 * Production environment configuration
 * Extends the default configuration with production-specific settings
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 80,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN || 'https://voting-app.example.com'
    }
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://mongodb:27017/voting-app-prod'
  },

  // Blockchain configuration
  blockchain: {
    network: 'mainnet',
    provider: process.env.WEB3_PROVIDER || 'https://mainnet.infura.io/v3/your-infura-project-id',
    gas: {
      limit: 3000000,
      price: process.env.GAS_PRICE || '50000000000' // 50 Gwei
    }
  },

  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: '12h'
  },

  // Application settings
  app: {
    debugMode: false,
    theme: {
      defaultTheme: 'light'
    }
  },

  // Logging configuration
  logging: {
    level: 'info',
    file: '/var/log/voting-app/production.log'
  }
}; 