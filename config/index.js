/**
 * Configuration loader for the Voting App
 * This file loads and merges the default configuration with environment-specific settings
 */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Determine the environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load the default configuration
const defaultConfig = require('./default');

// Load environment-specific configuration
let envConfig = {};
try {
  envConfig = require(`./${NODE_ENV}`);
} catch (error) {
  console.warn(`No configuration file found for environment: ${NODE_ENV}`);
}

// Merge configurations
const config = _.merge({}, defaultConfig, envConfig);

// Override with environment variables
function overrideFromEnv(config, prefix = '') {
  for (const key in config) {
    const envKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();
    
    if (typeof config[key] === 'object' && config[key] !== null) {
      overrideFromEnv(config[key], envKey);
    } else if (process.env[envKey] !== undefined) {
      // Convert string values to appropriate types
      let value = process.env[envKey];
      
      // Try to parse as JSON
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Not JSON, keep as string
      }
      
      // Convert boolean strings
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Convert number strings
      if (!isNaN(value) && typeof value === 'string') value = Number(value);
      
      config[key] = value;
    }
  }
  
  return config;
}

// Apply environment variable overrides
const finalConfig = overrideFromEnv(config);

// Add helper methods
finalConfig.get = function(key) {
  return _.get(this, key);
};

finalConfig.set = function(key, value) {
  _.set(this, key, value);
};

// Freeze the configuration to prevent modifications
Object.freeze(finalConfig);

module.exports = finalConfig; 