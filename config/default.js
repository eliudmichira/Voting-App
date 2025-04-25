/**
 * Default configuration for the Voting App
 * This file contains the base configuration that applies to all environments
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400 // 24 hours
    }
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/voting-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Blockchain configuration
  blockchain: {
    // Default network (can be overridden by environment-specific configs)
    network: process.env.BLOCKCHAIN_NETWORK || 'development',
    
    // Gas settings
    gas: {
      limit: process.env.GAS_LIMIT || 5000000,
      price: process.env.GAS_PRICE || '20000000000' // 20 Gwei
    },
    
    // Contract addresses (will be populated after deployment)
    contracts: {
      voting: process.env.VOTING_CONTRACT_ADDRESS || ''
    },
    
    // Web3 provider
    provider: process.env.WEB3_PROVIDER || 'http://localhost:8545'
  },

  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: 10
  },

  // Application settings
  app: {
    name: 'Voting App',
    version: '1.0.0',
    defaultImageUrl: process.env.DEFAULT_IMAGE_URL || '/images/default-avatar.png',
    debugMode: process.env.DEBUG_MODE === 'true',
    theme: {
      defaultTheme: process.env.DEFAULT_THEME || 'light'
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
}; 