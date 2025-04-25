const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Configuration file paths
const CONFIG_DIR = path.join(__dirname, '../../../config');
const DEFAULT_CONFIG = path.join(CONFIG_DIR, 'default.js');
const DEVELOPMENT_CONFIG = path.join(CONFIG_DIR, 'development.js');
const PRODUCTION_CONFIG = path.join(CONFIG_DIR, 'production.js');

// Helper function to load configuration
async function loadConfig(environment = process.env.NODE_ENV || 'development') {
    try {
        // Load default config
        const defaultConfig = require(DEFAULT_CONFIG);
        
        // Load environment-specific config
        const envConfigPath = environment === 'production' ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
        const envConfig = require(envConfigPath);
        
        // Merge configs with environment taking precedence
        return { ...defaultConfig, ...envConfig };
    } catch (error) {
        console.error('Error loading configuration:', error);
        throw new Error('Failed to load configuration');
    }
}

// Helper function to save configuration
async function saveConfig(config, environment = process.env.NODE_ENV || 'development') {
    try {
        const envConfigPath = environment === 'production' ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
        const configString = `module.exports = ${JSON.stringify(config, null, 2)};`;
        await fs.writeFile(envConfigPath, configString, 'utf8');
    } catch (error) {
        console.error('Error saving configuration:', error);
        throw new Error('Failed to save configuration');
    }
}

// Get current configuration
router.get('/', async (req, res) => {
    try {
        const config = await loadConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update configuration
router.post('/', async (req, res) => {
    try {
        const newConfig = req.body;
        
        // Validate configuration
        if (!newConfig.server || !newConfig.blockchain) {
            throw new Error('Invalid configuration format');
        }
        
        // Load current config
        const currentConfig = await loadConfig();
        
        // Merge new config with current config
        const updatedConfig = {
            ...currentConfig,
            server: {
                ...currentConfig.server,
                ...newConfig.server
            },
            blockchain: {
                ...currentConfig.blockchain,
                ...newConfig.blockchain
            },
            app: {
                ...currentConfig.app,
                ...newConfig.app
            }
        };
        
        // Save updated config
        await saveConfig(updatedConfig);
        
        res.json(updatedConfig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset configuration to defaults
router.post('/reset', async (req, res) => {
    try {
        const defaultConfig = require(DEFAULT_CONFIG);
        await saveConfig(defaultConfig);
        res.json(defaultConfig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save contract address
router.post('/contract/address', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            throw new Error('Contract address is required');
        }
        
        // Load current config
        const config = await loadConfig();
        
        // Update contract address
        config.blockchain.contractAddress = address;
        
        // Save updated config
        await saveConfig(config);
        
        res.json({ success: true, address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 