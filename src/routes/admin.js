const express = require('express');
const router = express.Router();
const config = require('config');
const Web3 = require('web3');
const { Voting } = require('../contracts/Voting');
const { validateConfig } = require('../utils/validation');
const { saveDeployment, getDeployments, deleteDeployment } = require('../utils/deployment');

// Configuration routes
router.get('/config/current', (req, res) => {
    try {
        const currentConfig = {
            server: config.get('server'),
            blockchain: config.get('blockchain'),
            app: config.get('app')
        };
        res.json(currentConfig);
    } catch (error) {
        console.error('Error getting current config:', error);
        res.status(500).json({ error: 'Failed to get current configuration' });
    }
});

router.post('/config/update', async (req, res) => {
    try {
        const newConfig = req.body;
        
        // Validate the new configuration
        if (!validateConfig(newConfig)) {
            return res.status(400).json({ error: 'Invalid configuration format' });
        }

        // Update configuration
        // Note: In a production environment, you would want to implement proper
        // configuration management that persists changes and reloads the application
        Object.entries(newConfig).forEach(([section, values]) => {
            Object.entries(values).forEach(([key, value]) => {
                config.set(`${section}.${key}`, value);
            });
        });

        res.json({ message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

router.get('/config/environment/:env', (req, res) => {
    try {
        const env = req.params.env;
        const envConfig = config.get(env);
        
        if (!envConfig) {
            return res.status(404).json({ error: 'Environment not found' });
        }

        res.json(envConfig);
    } catch (error) {
        console.error('Error getting environment config:', error);
        res.status(500).json({ error: 'Failed to get environment configuration' });
    }
});

router.post('/config/reset', (req, res) => {
    try {
        // Reset to default configuration
        // Note: In a production environment, you would want to implement proper
        // configuration management that reloads default values
        const defaultConfig = config.get('default');
        res.json(defaultConfig);
    } catch (error) {
        console.error('Error resetting config:', error);
        res.status(500).json({ error: 'Failed to reset configuration' });
    }
});

// Deployment routes
router.post('/deployments/estimate-gas', async (req, res) => {
    try {
        const { network, adminAddress, votingDuration } = req.body;
        
        // Initialize Web3 with the selected network
        const web3 = new Web3(config.get(`blockchain.networks.${network}.provider`));
        
        // Get contract bytecode and ABI
        const contract = new web3.eth.Contract(Voting.abi);
        
        // Estimate gas for deployment
        const gasEstimate = await contract.deploy({
            data: Voting.bytecode,
            arguments: [adminAddress, votingDuration]
        }).estimateGas();

        res.json({ gasEstimate });
    } catch (error) {
        console.error('Error estimating gas:', error);
        res.status(500).json({ error: 'Failed to estimate gas' });
    }
});

router.post('/deployments/deploy', async (req, res) => {
    try {
        const { network, adminAddress, votingDuration } = req.body;
        
        // Initialize Web3 with the selected network
        const web3 = new Web3(config.get(`blockchain.networks.${network}.provider`));
        
        // Get contract bytecode and ABI
        const contract = new web3.eth.Contract(Voting.abi);
        
        // Deploy contract
        const deployTx = contract.deploy({
            data: Voting.bytecode,
            arguments: [adminAddress, votingDuration]
        });

        // Get gas estimate and price
        const gasEstimate = await deployTx.estimateGas();
        const gasPrice = await web3.eth.getGasPrice();

        // Send transaction
        const deployedContract = await deployTx.send({
            from: adminAddress,
            gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
            gasPrice: gasPrice
        });

        // Save deployment information
        const deployment = {
            contractName: 'Voting',
            network,
            address: deployedContract.options.address,
            timestamp: new Date(),
            adminAddress,
            votingDuration
        };

        await saveDeployment(deployment);

        res.json({
            address: deployedContract.options.address,
            transactionHash: deployedContract.transactionHash
        });
    } catch (error) {
        console.error('Error deploying contract:', error);
        res.status(500).json({ error: 'Failed to deploy contract' });
    }
});

router.get('/deployments/history', async (req, res) => {
    try {
        const deployments = await getDeployments();
        res.json(deployments);
    } catch (error) {
        console.error('Error getting deployment history:', error);
        res.status(500).json({ error: 'Failed to get deployment history' });
    }
});

router.post('/deployments/verify/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { network } = req.body;

        // Initialize Web3 with the selected network
        const web3 = new Web3(config.get(`blockchain.networks.${network}.provider`));
        
        // Verify contract on the blockchain explorer
        // Note: Implementation depends on the specific blockchain explorer API
        // This is a placeholder for the verification logic
        const verificationResult = await verifyContractOnExplorer(address, network);

        res.json({ success: true, verificationResult });
    } catch (error) {
        console.error('Error verifying contract:', error);
        res.status(500).json({ error: 'Failed to verify contract' });
    }
});

router.delete('/deployments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteDeployment(id);
        res.json({ message: 'Deployment deleted successfully' });
    } catch (error) {
        console.error('Error deleting deployment:', error);
        res.status(500).json({ error: 'Failed to delete deployment' });
    }
});

module.exports = router; 