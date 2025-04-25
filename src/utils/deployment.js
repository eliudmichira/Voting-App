const Web3 = require('web3');
const config = require('config');
const fs = require('fs').promises;
const path = require('path');

const DEPLOYMENT_HISTORY_FILE = path.join(__dirname, '../../data/deployments.json');

/**
 * Saves deployment information to the history file
 * @param {Object} deploymentInfo - Information about the deployment
 * @returns {Promise<void>}
 */
async function saveDeployment(deploymentInfo) {
    try {
        let deployments = [];
        try {
            const data = await fs.readFile(DEPLOYMENT_HISTORY_FILE, 'utf8');
            deployments = JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is invalid, start with empty array
        }

        deployments.push({
            ...deploymentInfo,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile(DEPLOYMENT_HISTORY_FILE, JSON.stringify(deployments, null, 2));
    } catch (error) {
        console.error('Error saving deployment:', error);
        throw error;
    }
}

/**
 * Retrieves deployment history
 * @returns {Promise<Array>} Array of deployment records
 */
async function getDeploymentHistory() {
    try {
        const data = await fs.readFile(DEPLOYMENT_HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Estimates gas for contract deployment
 * @param {Object} deploymentConfig - Deployment configuration
 * @returns {Promise<number>} Estimated gas cost
 */
async function estimateDeploymentGas(deploymentConfig) {
    const { network, adminAddress, votingDuration } = deploymentConfig;
    const networkConfig = config.get(`blockchain.networks.${network}`);
    
    const web3 = new Web3(networkConfig.provider);
    const contractABI = require('../../contracts/Voting.json').abi;
    const contractBytecode = require('../../contracts/Voting.json').bytecode;

    const contract = new web3.eth.Contract(contractABI);
    const deployData = contract.deploy({
        data: contractBytecode,
        arguments: [adminAddress, votingDuration]
    }).encodeABI();

    const gasEstimate = await web3.eth.estimateGas({
        data: deployData,
        from: adminAddress
    });

    return gasEstimate;
}

/**
 * Deploys the voting contract
 * @param {Object} deploymentConfig - Deployment configuration
 * @param {string} privateKey - Private key for signing the transaction
 * @returns {Promise<Object>} Deployment information
 */
async function deployContract(deploymentConfig, privateKey) {
    const { network, adminAddress, votingDuration } = deploymentConfig;
    const networkConfig = config.get(`blockchain.networks.${network}`);
    
    const web3 = new Web3(networkConfig.provider);
    const contractABI = require('../../contracts/Voting.json').abi;
    const contractBytecode = require('../../contracts/Voting.json').bytecode;

    const contract = new web3.eth.Contract(contractABI);
    const deployData = contract.deploy({
        data: contractBytecode,
        arguments: [adminAddress, votingDuration]
    }).encodeABI();

    const gasEstimate = await estimateDeploymentGas(deploymentConfig);
    const gasPrice = await web3.eth.getGasPrice();

    const transaction = {
        from: adminAddress,
        data: deployData,
        gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        gasPrice: gasPrice
    };

    const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    const deploymentInfo = {
        network,
        contractAddress: receipt.contractAddress,
        adminAddress,
        votingDuration,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
    };

    await saveDeployment(deploymentInfo);
    return deploymentInfo;
}

/**
 * Verifies a deployed contract on the blockchain explorer
 * @param {string} contractAddress - Address of the deployed contract
 * @param {Object} deploymentConfig - Original deployment configuration
 * @returns {Promise<boolean>} Success status
 */
async function verifyContract(contractAddress, deploymentConfig) {
    // Implementation depends on the specific blockchain explorer API
    // This is a placeholder for the verification logic
    try {
        // Add verification logic here
        return true;
    } catch (error) {
        console.error('Error verifying contract:', error);
        return false;
    }
}

module.exports = {
    saveDeployment,
    getDeploymentHistory,
    estimateDeploymentGas,
    deployContract,
    verifyContract
}; 