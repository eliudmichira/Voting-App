const config = require('config');

/**
 * Validates the configuration object structure and values
 * @param {Object} configObj - The configuration object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateConfig(configObj) {
    try {
        // Check if all required sections are present
        const requiredSections = ['server', 'blockchain', 'app'];
        for (const section of requiredSections) {
            if (!configObj[section]) {
                console.error(`Missing required section: ${section}`);
                return false;
            }
        }

        // Validate server configuration
        const serverConfig = configObj.server;
        if (!serverConfig.port || !Number.isInteger(serverConfig.port) || serverConfig.port < 1 || serverConfig.port > 65535) {
            console.error('Invalid server port');
            return false;
        }

        // Validate blockchain configuration
        const blockchainConfig = configObj.blockchain;
        if (!blockchainConfig.network || !blockchainConfig.gasLimit || !blockchainConfig.gasPrice) {
            console.error('Invalid blockchain configuration');
            return false;
        }

        // Validate network configuration
        const networkConfig = blockchainConfig.networks[blockchainConfig.network];
        if (!networkConfig || !networkConfig.provider) {
            console.error('Invalid network configuration');
            return false;
        }

        // Validate app configuration
        const appConfig = configObj.app;
        if (!appConfig.votingDuration || !Number.isInteger(appConfig.votingDuration) || appConfig.votingDuration < 1) {
            console.error('Invalid voting duration');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating configuration:', error);
        return false;
    }
}

/**
 * Validates a deployment configuration
 * @param {Object} deploymentConfig - The deployment configuration to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateDeploymentConfig(deploymentConfig) {
    try {
        const { network, adminAddress, votingDuration } = deploymentConfig;

        // Validate network
        if (!network || !config.get(`blockchain.networks.${network}`)) {
            console.error('Invalid network');
            return false;
        }

        // Validate admin address
        if (!adminAddress || !/^0x[a-fA-F0-9]{40}$/.test(adminAddress)) {
            console.error('Invalid admin address');
            return false;
        }

        // Validate voting duration
        if (!votingDuration || !Number.isInteger(votingDuration) || votingDuration < 1) {
            console.error('Invalid voting duration');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating deployment configuration:', error);
        return false;
    }
}

module.exports = {
    validateConfig,
    validateDeploymentConfig
}; 