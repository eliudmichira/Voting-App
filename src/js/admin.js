// Remove the import statement since we're loading ethers.js directly in the HTML
// import { ethers } from 'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js';

// Remove unused web3 variable since we're using ethers instead
// Declare contract as a global variable so it can be used in multiple functions
let contract;
const contractAddress = '0x2386778193F81C6E961E131D39C5b7D640e80864';
const abi = []; // Your contract ABI here

// Debug logging function
function debugLog(message) {
    console.log(`[Admin] ${message}`);
}

// Mock API data for development
const mockConfig = {
    server: {
        port: 8080,
        host: 'localhost'
    },
    blockchain: {
        network: 'localhost',
        gasLimit: 3000000,
        gasPrice: 5
    },
    app: {
        votingDuration: 7
    }
};

const mockDeployments = [
    {
        id: '1',
        contractName: 'Voting',
        network: 'localhost',
        address: '0x2386778193F81C6E961E131D39C5b7D640e80864',
        timestamp: new Date().toISOString()
    }
];

// Mock API functions
async function mockFetch(url, options = {}) {
    debugLog(`Mock API call: ${url} ${options.method || 'GET'}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.includes('/api/config/current')) {
        return {
            ok: true,
            json: async () => mockConfig
        };
    }
    
    if (url.includes('/api/config/update')) {
        const data = JSON.parse(options.body);
        Object.assign(mockConfig, data);
        return {
            ok: true,
            json: async () => ({ success: true })
        };
    }
    
    if (url.includes('/api/config/environment/')) {
        const env = url.split('/').pop();
        return {
            ok: true,
            json: async () => ({
                ...mockConfig,
                environment: env
            })
        };
    }
    
    if (url.includes('/api/config/reset')) {
        return {
            ok: true,
            json: async () => mockConfig
        };
    }
    
    if (url.includes('/api/deployments/history')) {
        return {
            ok: true,
            json: async () => mockDeployments
        };
    }
    
    if (url.includes('/api/deployments/estimate-gas')) {
        return {
            ok: true,
            json: async () => ({ gasEstimate: 2000000 })
        };
    }
    
    if (url.includes('/api/deployments/deploy')) {
        const data = JSON.parse(options.body);
        const newDeployment = {
            id: (mockDeployments.length + 1).toString(),
            contractName: 'Voting',
            network: data.network,
            address: '0x' + Math.random().toString(16).substring(2, 42),
            timestamp: new Date().toISOString()
        };
        mockDeployments.push(newDeployment);
        return {
            ok: true,
            json: async () => newDeployment
        };
    }
    
    if (url.includes('/api/deployments/verify/')) {
        return {
            ok: true,
            json: async () => ({ success: true })
        };
    }
    
    if (url.includes('/api/deployments/') && options.method === 'DELETE') {
        const id = url.split('/').pop();
        const index = mockDeployments.findIndex(d => d.id === id);
        if (index !== -1) {
            mockDeployments.splice(index, 1);
        }
        return {
            ok: true,
            json: async () => ({ success: true })
        };
    }
    
    // Default response for unknown endpoints
    return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
    };
}

// Override fetch with mock implementation
window.fetch = mockFetch;

async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            debugLog('MetaMask detected, requesting accounts');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            const walletAddressElement = document.getElementById('walletAddress');
            if (walletAddressElement) {
                walletAddressElement.innerText = account;
            }
            
            debugLog('Creating provider and contract');
            // Create provider and contract
            const provider = new ethers.BrowserProvider(window.ethereum);
            contract = new ethers.Contract(contractAddress, abi, await provider.getSigner());
            
            debugLog(`Contract initialized at address: ${contract.address}`);
            return contract;
        } else {
            debugLog('MetaMask not detected');
            alert('Please install MetaMask!');
            return null;
        }
    } catch (error) {
        debugLog(`Error connecting wallet: ${error.message}`);
        console.error('Error connecting wallet:', error);
        return null;
    }
}

/* eslint-disable no-unused-vars */
// These functions are used in HTML event handlers, so they're not recognized as used by ESLint
function loadCandidates() {
    // Load candidates from the blockchain
    if (!contract) return [];
    // Implementation of loading candidates
    return [];
}

function addCandidate() {
    const candidateName = document.getElementById('candidateName').value;
    // Add candidate to the blockchain
    if (!contract || !candidateName) return false;
    // Implementation of adding a candidate
    console.log(`Adding candidate: ${candidateName}`);
    return true;
}
/* eslint-enable no-unused-vars */

// Initialize managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded, initializing admin interface');
    
    // Check if MetaMask is available
    if (typeof window.ethereum !== 'undefined') {
        debugLog('MetaMask detected, connecting wallet');
        connectWallet();
    } else {
        debugLog('MetaMask not detected');
    }
    
    // Initialize managers
    try {
        debugLog('Initializing ConfigManager');
        window.configManager = new ConfigManager();
        
        debugLog('Initializing DeploymentManager');
        window.deploymentManager = new DeploymentManager();
        
        debugLog('Admin interface initialized successfully');
    } catch (error) {
        debugLog(`Error initializing admin interface: ${error.message}`);
        console.error('Error initializing admin interface:', error);
    }
});

// Configuration Management
class ConfigManager {
    constructor() {
        debugLog('Initializing ConfigManager');
        this.configForm = document.getElementById('configForm');
        this.exportConfigBtn = document.getElementById('exportConfigBtn');
        this.importConfigFile = document.getElementById('importConfigFile');
        this.environmentSelect = document.getElementById('environmentSelect');
        this.resetConfigBtn = document.getElementById('resetConfig');
        
        this.initializeEventListeners();
        this.loadCurrentConfig();
    }

    initializeEventListeners() {
        debugLog('Setting up ConfigManager event listeners');
        if (this.configForm) {
            this.configForm.addEventListener('submit', (e) => this.handleConfigSubmit(e));
        } else {
            debugLog('Warning: configForm element not found');
        }
        
        if (this.exportConfigBtn) {
            this.exportConfigBtn.addEventListener('click', () => this.exportConfig());
        } else {
            debugLog('Warning: exportConfigBtn element not found');
        }
        
        if (this.importConfigFile) {
            this.importConfigFile.addEventListener('change', (e) => this.importConfig(e));
        } else {
            debugLog('Warning: importConfigFile element not found');
        }
        
        if (this.environmentSelect) {
            this.environmentSelect.addEventListener('change', (e) => this.switchEnvironment(e));
        } else {
            debugLog('Warning: environmentSelect element not found');
        }
        
        if (this.resetConfigBtn) {
            this.resetConfigBtn.addEventListener('click', () => this.resetToDefaults());
        } else {
            debugLog('Warning: resetConfigBtn element not found');
        }
    }

    async loadCurrentConfig() {
        try {
            debugLog('Loading current configuration');
            const response = await fetch('/api/config/current');
            const config = await response.json();
            this.populateForm(config);
            debugLog('Configuration loaded successfully');
        } catch (error) {
            debugLog(`Error loading configuration: ${error.message}`);
            console.error('Error loading configuration:', error);
            this.showNotification('Error loading configuration', 'error');
        }
    }

    populateForm(config) {
        Object.entries(config).forEach(([section, values]) => {
            Object.entries(values).forEach(([key, value]) => {
                const input = document.querySelector(`[name="${section}.${key}"]`);
                if (input) {
                    input.value = value;
                }
            });
        });
    }

    async handleConfigSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.configForm);
        const config = {};
        
        formData.forEach((value, key) => {
            const [section, field] = key.split('.');
            if (!config[section]) config[section] = {};
            config[section][field] = value;
        });

        try {
            const response = await fetch('/api/config/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                this.showNotification('Configuration updated successfully', 'success');
                localStorage.setItem('appConfig', JSON.stringify(config));
            } else {
                throw new Error('Failed to update configuration');
            }
        } catch (error) {
            console.error('Error updating configuration:', error);
            this.showNotification('Error updating configuration', 'error');
        }
    }

    exportConfig() {
        const config = localStorage.getItem('appConfig');
        if (!config) {
            this.showNotification('No configuration to export', 'warning');
            return;
        }

        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voting-app-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importConfig(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const config = await file.text();
            const parsedConfig = JSON.parse(config);
            
            if (!this.validateConfig(parsedConfig)) {
                throw new Error('Invalid configuration format');
            }

            const response = await fetch('/api/config/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedConfig)
            });

            if (response.ok) {
                localStorage.setItem('appConfig', JSON.stringify(parsedConfig));
                this.populateForm(parsedConfig);
                this.showNotification('Configuration imported successfully', 'success');
            } else {
                throw new Error('Failed to import configuration');
            }
        } catch (error) {
            console.error('Error importing configuration:', error);
            this.showNotification('Error importing configuration', 'error');
        }
    }

    validateConfig(config) {
        const requiredSections = ['server', 'blockchain', 'app'];
        return requiredSections.every(section => config[section]);
    }

    async switchEnvironment(e) {
        const environment = e.target.value;
        try {
            const response = await fetch(`/api/config/environment/${environment}`);
            const config = await response.json();
            
            if (response.ok) {
                this.populateForm(config);
                localStorage.setItem('currentEnvironment', environment);
                this.showNotification(`Switched to ${environment} environment`, 'success');
            } else {
                throw new Error('Failed to switch environment');
            }
        } catch (error) {
            console.error('Error switching environment:', error);
            this.showNotification('Error switching environment', 'error');
        }
    }

    async resetToDefaults() {
        if (!confirm('Are you sure you want to reset to default configuration?')) return;

        try {
            const response = await fetch('/api/config/reset', {
                method: 'POST'
            });

            if (response.ok) {
                const config = await response.json();
                this.populateForm(config);
                localStorage.removeItem('appConfig');
                this.showNotification('Configuration reset to defaults', 'success');
            } else {
                throw new Error('Failed to reset configuration');
            }
        } catch (error) {
            console.error('Error resetting configuration:', error);
            this.showNotification('Error resetting configuration', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'error' ? 'bg-red-500' :
            type === 'success' ? 'bg-green-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Contract Deployment
class DeploymentManager {
    constructor() {
        debugLog('Initializing DeploymentManager');
        this.deploymentNetwork = document.getElementById('deploymentNetwork');
        this.adminAddress = document.getElementById('adminAddress');
        this.votingDuration = document.getElementById('votingDuration');
        this.estimateGasBtn = document.getElementById('estimateGas');
        this.deployContractBtn = document.getElementById('deployContract');
        this.deploymentHistoryBody = document.getElementById('deploymentHistoryBody');
        this.noDeployments = document.getElementById('noDeployments');

        this.initializeEventListeners();
        this.loadDeploymentHistory();
    }

    initializeEventListeners() {
        debugLog('Setting up DeploymentManager event listeners');
        if (this.estimateGasBtn) {
            this.estimateGasBtn.addEventListener('click', () => this.estimateGas());
        } else {
            debugLog('Warning: estimateGasBtn element not found');
        }
        
        if (this.deployContractBtn) {
            this.deployContractBtn.addEventListener('click', () => this.deployContract());
        } else {
            debugLog('Warning: deployContractBtn element not found');
        }
    }

    async loadDeploymentHistory() {
        try {
            debugLog('Loading deployment history');
            const response = await fetch('/api/deployments/history');
            const deployments = await response.json();
            this.renderDeploymentHistory(deployments);
            debugLog('Deployment history loaded successfully');
        } catch (error) {
            debugLog(`Error loading deployment history: ${error.message}`);
            console.error('Error loading deployment history:', error);
            this.showNotification('Error loading deployment history', 'error');
        }
    }

    renderDeploymentHistory(deployments) {
        if (!this.deploymentHistoryBody) return;

        if (!deployments.length) {
            if (this.noDeployments) {
                this.noDeployments.classList.remove('hidden');
            }
            this.deploymentHistoryBody.innerHTML = '';
            return;
        }

        if (this.noDeployments) {
            this.noDeployments.classList.add('hidden');
        }

        this.deploymentHistoryBody.innerHTML = deployments.map(deployment => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${deployment.contractName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${deployment.network}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${deployment.address}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${new Date(deployment.timestamp).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <button class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-2" 
                            onclick="deploymentManager.verifyContract('${deployment.address}')">
                        Verify
                    </button>
                    <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onclick="deploymentManager.deleteDeployment('${deployment.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async estimateGas() {
        const params = this.getDeploymentParams();
        try {
            const response = await fetch('/api/deployments/estimate-gas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (response.ok) {
                const { gasEstimate } = await response.json();
                this.showNotification(`Estimated gas: ${gasEstimate}`, 'info');
            } else {
                throw new Error('Failed to estimate gas');
            }
        } catch (error) {
            console.error('Error estimating gas:', error);
            this.showNotification('Error estimating gas', 'error');
        }
    }

    async deployContract() {
        const params = this.getDeploymentParams();
        try {
            const response = await fetch('/api/deployments/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification('Contract deployed successfully', 'success');
                this.loadDeploymentHistory();
            } else {
                throw new Error('Failed to deploy contract');
            }
        } catch (error) {
            console.error('Error deploying contract:', error);
            this.showNotification('Error deploying contract', 'error');
        }
    }

    getDeploymentParams() {
        return {
            network: this.deploymentNetwork?.value || '',
            adminAddress: this.adminAddress?.value || '',
            votingDuration: parseInt(this.votingDuration?.value || '0')
        };
    }

    async verifyContract(address) {
        try {
            const response = await fetch(`/api/deployments/verify/${address}`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showNotification('Contract verified successfully', 'success');
            } else {
                throw new Error('Failed to verify contract');
            }
        } catch (error) {
            console.error('Error verifying contract:', error);
            this.showNotification('Error verifying contract', 'error');
        }
    }

    async deleteDeployment(id) {
        if (!confirm('Are you sure you want to delete this deployment?')) return;

        try {
            const response = await fetch(`/api/deployments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Deployment deleted successfully', 'success');
                this.loadDeploymentHistory();
            } else {
                throw new Error('Failed to delete deployment');
            }
        } catch (error) {
            console.error('Error deleting deployment:', error);
            this.showNotification('Error deleting deployment', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'error' ? 'bg-red-500' :
            type === 'success' ? 'bg-green-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}
