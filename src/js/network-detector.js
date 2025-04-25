/**
 * Network Detector
 * 
 * Detects the current blockchain network and provides 
 * functionality to switch networks when needed.
 */

class NetworkDetector {
  constructor(web3Instance, targetNetworkId = '0x539') { // Default to Ganache (1337)
    this.web3 = web3Instance;
    this.targetNetworkId = targetNetworkId;
    this.currentNetworkId = null;
    this.isCorrectNetwork = false;
    this.networks = {
      '0x1': {
        name: 'Ethereum Mainnet',
        chainId: '0x1',
        isProduction: true,
        currencySymbol: 'ETH',
        blockExplorer: 'https://etherscan.io'
      },
      '0x3': {
        name: 'Ropsten Testnet',
        chainId: '0x3',
        isProduction: false,
        currencySymbol: 'ETH',
        blockExplorer: 'https://ropsten.etherscan.io'
      },
      '0x4': {
        name: 'Rinkeby Testnet',
        chainId: '0x4',
        isProduction: false,
        currencySymbol: 'ETH',
        blockExplorer: 'https://rinkeby.etherscan.io'
      },
      '0x5': {
        name: 'Goerli Testnet',
        chainId: '0x5',
        isProduction: false,
        currencySymbol: 'ETH',
        blockExplorer: 'https://goerli.etherscan.io'
      },
      '0x539': { // 1337 in hex
        name: 'Ganache Local',
        chainId: '0x539',
        isProduction: false,
        currencySymbol: 'ETH',
        blockExplorer: ''
      },
      '0x1B57': { // 7575 in hex
        name: 'Ganache GUI',
        chainId: '0x1B57',
        isProduction: false,
        currencySymbol: 'ETH',
        blockExplorer: ''
      }
    };
  }

  /**
   * Check if the current network matches the target network
   */
  async checkNetwork() {
    try {
      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.currentNetworkId = chainId;
      
      // Check if it's the target network
      this.isCorrectNetwork = chainId === this.targetNetworkId;
      
      // Update UI
      this.updateNetworkDisplay();
      
      return this.isCorrectNetwork;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  /**
   * Get information about the current network
   */
  getCurrentNetworkInfo() {
    if (!this.currentNetworkId) return null;
    
    return this.networks[this.currentNetworkId] || {
      name: `Unknown Network (${this.currentNetworkId})`,
      chainId: this.currentNetworkId,
      isProduction: false,
      currencySymbol: 'ETH',
      blockExplorer: ''
    };
  }

  /**
   * Get information about the target network
   */
  getTargetNetworkInfo() {
    return this.networks[this.targetNetworkId] || {
      name: `Unknown Network (${this.targetNetworkId})`,
      chainId: this.targetNetworkId,
      isProduction: false,
      currencySymbol: 'ETH',
      blockExplorer: ''
    };
  }

  /**
   * Update the network display in the UI
   */
  updateNetworkDisplay() {
    const networkDisplay = document.getElementById('networkDisplay');
    if (!networkDisplay) return;
    
    const currentNetwork = this.getCurrentNetworkInfo();
    if (!currentNetwork) {
      networkDisplay.textContent = 'No Network';
      networkDisplay.className = 'text-gray-500 dark:text-gray-400';
      return;
    }
    
    // Set network name
    networkDisplay.textContent = currentNetwork.name;
    
    // Set color based on correct network and production status
    if (this.isCorrectNetwork) {
      networkDisplay.className = 'text-green-500 dark:text-green-400 font-medium';
    } else if (currentNetwork.isProduction) {
      networkDisplay.className = 'text-yellow-500 dark:text-yellow-400 font-medium';
    } else {
      networkDisplay.className = 'text-red-500 dark:text-red-400 font-medium';
    }
    
    // Add tooltip
    networkDisplay.setAttribute('title', 
      this.isCorrectNetwork 
        ? 'Connected to the correct network' 
        : `Connected to ${currentNetwork.name}. Should be connected to ${this.getTargetNetworkInfo().name}`
    );
  }

  /**
   * Show network switch dialog if on wrong network
   */
  async promptNetworkSwitch() {
    if (this.isCorrectNetwork) return true;
    
    const targetNetwork = this.getTargetNetworkInfo();
    const currentNetwork = this.getCurrentNetworkInfo();
    
    if (!window.confirm(
      `You are currently connected to ${currentNetwork.name}.\n` +
      `This application requires ${targetNetwork.name}.\n\n` +
      `Would you like to switch networks?`
    )) {
      return false;
    }
    
    try {
      await this.switchToTargetNetwork();
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      alert(`Failed to switch network: ${error.message}`);
      return false;
    }
  }

  /**
   * Switch to the target network
   */
  async switchToTargetNetwork() {
    try {
      // Request network switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.targetNetworkId }],
      });
      
      // Re-check network
      return await this.checkNetwork();
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        return await this.addTargetNetwork();
      }
      throw switchError;
    }
  }

  /**
   * Add the target network to wallet if it doesn't exist
   */
  async addTargetNetwork() {
    const targetNetwork = this.getTargetNetworkInfo();
    
    // For Ganache local, use specific parameters
    if (this.targetNetworkId === '0x539') { // Ganache
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x539', // 1337 in hex
              chainName: 'Ganache Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:7545'],
              blockExplorerUrls: []
            }
          ]
        });
        
        // Re-check network after adding
        return await this.checkNetwork();
      } catch (addError) {
        console.error('Error adding Ganache network:', addError);
        throw addError;
      }
    } else {
      throw new Error(`Adding network ${targetNetwork.name} not implemented`);
    }
  }

  /**
   * Set up network change listener
   */
  setupNetworkChangeListener() {
    if (!window.ethereum) return;
    
    window.ethereum.on('chainChanged', (chainId) => {
      // Update network info
      this.currentNetworkId = chainId;
      this.isCorrectNetwork = chainId === this.targetNetworkId;
      
      // Update UI
      this.updateNetworkDisplay();
      
      // If needed, reload page on network change
      // window.location.reload();
    });
  }
}

// Export the network detector
window.NetworkDetector = NetworkDetector; 