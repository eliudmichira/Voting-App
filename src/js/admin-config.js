// Configuration Management and Contract Deployment Handler
import { ethers } from 'ethers';
import VotingContract from '../../contracts/Voting.sol';

class AdminConfigManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.config = {};
        
        // Initialize event listeners
        this.initializeEventListeners();
        this.loadCurrentConfig();
    }

    async initializeEventListeners() {
        // Configuration form handling
        document.getElementById('configForm').addEventListener('submit', this.handleConfigSubmit.bind(this));
        document.getElementById('resetConfig').addEventListener('click', this.handleConfigReset.bind(this));
        
        // Contract deployment handling
        document.getElementById('deploymentNetwork').addEventListener('change', this.handleNetworkChange.bind(this));
        document.getElementById('estimateGas').addEventListener('click', this.handleGasEstimate.bind(this));
        document.getElementById('deployContract').addEventListener('click', this.handleContractDeploy.bind(this));
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', this.handleTabSwitch.bind(this));
        });
    }

    async loadCurrentConfig() {
        try {
            const response = await fetch('/api/config');
            this.config = await response.json();
            this.populateConfigForm();
        } catch (error) {
            this.showNotification('Error loading configuration', 'error');
        }
    }

    populateConfigForm() {
        // Populate server settings
        document.getElementById('serverPort').value = this.config.server?.port || '';
        document.getElementById('serverHost').value = this.config.server?.host || '';
        
        // Populate blockchain settings
        document.getElementById('networkProvider').value = this.config.blockchain?.provider || '';
        document.getElementById('gasLimit').value = this.config.blockchain?.gas?.limit || '';
        
        // Populate theme settings
        document.getElementById('defaultTheme').value = this.config.app?.theme?.defaultTheme || 'light';
    }

    async handleConfigSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const config = {
            server: {
                port: parseInt(formData.get('server.port')),
                host: formData.get('server.host')
            },
            blockchain: {
                provider: formData.get('blockchain.provider'),
                gas: {
                    limit: parseInt(formData.get('blockchain.gas.limit'))
                }
            },
            app: {
                theme: {
                    defaultTheme: formData.get('app.theme.defaultTheme')
                }
            }
        };

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.showNotification('Configuration updated successfully', 'success');
                this.config = config;
            } else {
                throw new Error('Failed to update configuration');
            }
        } catch (error) {
            this.showNotification('Error updating configuration: ' + error.message, 'error');
        }
    }

    async handleConfigReset() {
        try {
            const response = await fetch('/api/config/reset', { method: 'POST' });
            if (response.ok) {
                this.config = await response.json();
                this.populateConfigForm();
                this.showNotification('Configuration reset to defaults', 'success');
            }
        } catch (error) {
            this.showNotification('Error resetting configuration', 'error');
        }
    }

    async handleNetworkChange(event) {
        const network = event.target.value;
        const provider = this.getProviderForNetwork(network);
        this.provider = provider;
        
        try {
            const signer = provider.getSigner();
            this.signer = signer;
            const address = await signer.getAddress();
            document.getElementById('adminAddress').value = address;
        } catch (error) {
            this.showNotification('Error connecting to network: ' + error.message, 'error');
        }
    }

    getProviderForNetwork(network) {
        switch (network) {
            case 'development':
                return new ethers.providers.JsonRpcProvider('http://localhost:8545');
            case 'testnet':
                return new ethers.providers.JsonRpcProvider(this.config.blockchain.testnetProvider);
            case 'mainnet':
                return new ethers.providers.JsonRpcProvider(this.config.blockchain.mainnetProvider);
            default:
                throw new Error('Invalid network selected');
        }
    }

    async handleGasEstimate() {
        try {
            const factory = new ethers.ContractFactory(
                VotingContract.abi,
                VotingContract.bytecode,
                this.signer
            );

            const adminAddress = document.getElementById('adminAddress').value;
            const votingDuration = parseInt(document.getElementById('votingDuration').value) * 24 * 60 * 60; // Convert days to seconds

            const estimatedGas = await factory.estimateGas.deploy(adminAddress, votingDuration);
            this.showNotification(`Estimated gas: ${estimatedGas.toString()} units`, 'info');
        } catch (error) {
            this.showNotification('Error estimating gas: ' + error.message, 'error');
        }
    }

    async handleContractDeploy() {
        try {
            this.updateDeploymentProgress(1);
            
            // Compile contract (in production this would be done during build)
            this.updateDeploymentProgress(2);
            
            const factory = new ethers.ContractFactory(
                VotingContract.abi,
                VotingContract.bytecode,
                this.signer
            );

            const adminAddress = document.getElementById('adminAddress').value;
            const votingDuration = parseInt(document.getElementById('votingDuration').value) * 24 * 60 * 60;

            const contract = await factory.deploy(adminAddress, votingDuration);
            await contract.deployed();
            
            this.updateDeploymentProgress(3);
            
            // Save the contract address
            await this.saveContractAddress(contract.address);
            
            this.showNotification(`Contract deployed successfully at ${contract.address}`, 'success');
        } catch (error) {
            this.showNotification('Error deploying contract: ' + error.message, 'error');
        }
    }

    async saveContractAddress(address) {
        try {
            await fetch('/api/contract/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address })
            });
        } catch (error) {
            console.error('Error saving contract address:', error);
        }
    }

    updateDeploymentProgress(step) {
        const steps = document.querySelectorAll('#content-deployment ol li');
        steps.forEach((stepElement, index) => {
            if (index + 1 === step) {
                stepElement.classList.remove('opacity-50');
                stepElement.querySelector('span:first-child').classList.add('bg-primary-100', 'dark:bg-primary-900', 'text-primary-600', 'dark:text-primary-400');
                stepElement.querySelector('span:first-child').classList.remove('bg-gray-200', 'dark:bg-gray-800');
            }
        });
    }

    handleTabSwitch(event) {
        const targetId = event.currentTarget.getAttribute('aria-controls');
        
        // Update button states
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('text-primary-600', 'dark:text-primary-400', 'border-primary-500', 'dark:border-primary-400');
            button.classList.add('text-gray-500', 'dark:text-gray-400', 'border-transparent');
        });
        
        event.currentTarget.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-transparent');
        event.currentTarget.classList.add('text-primary-600', 'dark:text-primary-400', 'border-primary-500', 'dark:border-primary-400');
        
        // Update content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'error' ? 'bg-red-500' :
            type === 'success' ? 'bg-green-500' :
            'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the admin configuration manager
document.addEventListener('DOMContentLoaded', () => {
    window.adminConfigManager = new AdminConfigManager();
}); 