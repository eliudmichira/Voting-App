/**
 * Deployment Configuration Manager
 * 
 * Manages deployment configurations for different environments
 * and tracks deployment costs and statistics.
 */

class DeploymentConfigManager {
  constructor() {
    this.configs = this.loadConfigs();
    this.currentConfig = null;
    this.deploymentStats = this.loadDeploymentStats();
  }

  /**
   * Initialize the manager
   */
  init() {
    // Load configurations from storage
    this.configs = this.loadConfigs();
    
    // Load deployment stats
    this.deploymentStats = this.loadDeploymentStats();
    
    // Set current config to the last used one
    const lastUsedConfig = localStorage.getItem('lastUsedConfigName');
    if (lastUsedConfig && this.configs[lastUsedConfig]) {
      this.currentConfig = this.configs[lastUsedConfig];
    } else if (Object.keys(this.configs).length > 0) {
      // Use the first available config
      const firstConfigName = Object.keys(this.configs)[0];
      this.currentConfig = this.configs[firstConfigName];
    } else {
      // Create default config if none exists
      this.createDefaultConfig();
    }
    
    // Update UI
    this.updateConfigUI();
    this.updateStatsUI();
  }

  /**
   * Create default configuration
   */
  createDefaultConfig() {
    const defaultConfig = {
      name: 'Development',
      description: 'Local Ganache deployment',
      networkId: '1337',
      gasLimit: 5000000,
      gasPrice: 20, // gwei
      provider: 'http://127.0.0.1:7545',
      accounts: {
        deployer: '0',  // Use first account from Ganache
        admin: '0'      // Same as deployer
      },
      contracts: {}
    };
    
    this.configs['Development'] = defaultConfig;
    this.currentConfig = defaultConfig;
    this.saveConfigs();
  }

  /**
   * Load configurations from local storage
   */
  loadConfigs() {
    const configsJson = localStorage.getItem('deploymentConfigs');
    
    if (configsJson) {
      try {
        return JSON.parse(configsJson);
      } catch (error) {
        console.error('Error parsing deployment configs:', error);
      }
    }
    
    return {};
  }

  /**
   * Save configurations to local storage
   */
  saveConfigs() {
    localStorage.setItem('deploymentConfigs', JSON.stringify(this.configs));
  }

  /**
   * Load deployment statistics from local storage
   */
  loadDeploymentStats() {
    const statsJson = localStorage.getItem('deploymentStats');
    
    if (statsJson) {
      try {
        return JSON.parse(statsJson);
      } catch (error) {
        console.error('Error parsing deployment stats:', error);
      }
    }
    
    return {
      deployments: [],
      totalGasUsed: 0,
      averageGasPrice: 0,
      totalDeployments: 0,
      lastDeployment: null
    };
  }

  /**
   * Save deployment statistics to local storage
   */
  saveDeploymentStats() {
    localStorage.setItem('deploymentStats', JSON.stringify(this.deploymentStats));
  }

  /**
   * Add a new configuration
   */
  addConfig(config) {
    if (!config.name) {
      throw new Error('Configuration must have a name');
    }
    
    // Add or update config
    this.configs[config.name] = config;
    this.currentConfig = config;
    
    // Save to storage
    this.saveConfigs();
    localStorage.setItem('lastUsedConfigName', config.name);
    
    // Update UI
    this.updateConfigUI();
    
    return config;
  }

  /**
   * Delete a configuration
   */
  deleteConfig(name) {
    if (!this.configs[name]) {
      throw new Error(`Configuration '${name}' does not exist`);
    }
    
    // Don't delete the last config
    if (Object.keys(this.configs).length <= 1) {
      throw new Error('Cannot delete the last configuration');
    }
    
    // Delete the config
    delete this.configs[name];
    
    // If current config was deleted, select another one
    if (this.currentConfig.name === name) {
      const firstConfigName = Object.keys(this.configs)[0];
      this.currentConfig = this.configs[firstConfigName];
      localStorage.setItem('lastUsedConfigName', firstConfigName);
    }
    
    // Save to storage
    this.saveConfigs();
    
    // Update UI
    this.updateConfigUI();
    
    return true;
  }

  /**
   * Switch to a different configuration
   */
  switchConfig(name) {
    if (!this.configs[name]) {
      throw new Error(`Configuration '${name}' does not exist`);
    }
    
    this.currentConfig = this.configs[name];
    localStorage.setItem('lastUsedConfigName', name);
    
    // Update UI
    this.updateConfigUI();
    
    return this.currentConfig;
  }

  /**
   * Get the current configuration
   */
  getCurrentConfig() {
    return this.currentConfig;
  }

  /**
   * Add a new deployment statistic
   */
  addDeploymentStat(stats) {
    const deployment = {
      timestamp: Date.now(),
      ...stats
    };
    
    // Add to the beginning of the array
    this.deploymentStats.deployments.unshift(deployment);
    
    // Limit history to 20 entries
    if (this.deploymentStats.deployments.length > 20) {
      this.deploymentStats.deployments = this.deploymentStats.deployments.slice(0, 20);
    }
    
    // Update summary statistics
    this.deploymentStats.totalDeployments++;
    this.deploymentStats.totalGasUsed += stats.gasUsed || 0;
    this.deploymentStats.averageGasPrice = stats.gasPrice || this.deploymentStats.averageGasPrice;
    this.deploymentStats.lastDeployment = deployment;
    
    // Save to storage
    this.saveDeploymentStats();
    
    // Update UI
    this.updateStatsUI();
    
    return deployment;
  }

  /**
   * Update the configuration UI
   */
  updateConfigUI() {
    // Update config selector dropdown
    const configSelector = document.getElementById('configSelector');
    if (configSelector) {
      configSelector.innerHTML = '';
      
      // Add options for each config
      Object.keys(this.configs).forEach(configName => {
        const option = document.createElement('option');
        option.value = configName;
        option.textContent = configName;
        option.selected = (this.currentConfig && this.currentConfig.name === configName);
        configSelector.appendChild(option);
      });
    }
    
    // Update current config display
    const currentConfigDisplay = document.getElementById('currentConfigDisplay');
    if (currentConfigDisplay && this.currentConfig) {
      currentConfigDisplay.innerHTML = `
        <div class="flex flex-col">
          <div class="mb-2">
            <span class="font-semibold">Name:</span> ${this.currentConfig.name}
          </div>
          <div class="mb-2">
            <span class="font-semibold">Description:</span> ${this.currentConfig.description || 'No description'}
          </div>
          <div class="mb-2">
            <span class="font-semibold">Network ID:</span> ${this.currentConfig.networkId}
          </div>
          <div class="mb-2">
            <span class="font-semibold">Provider:</span> ${this.currentConfig.provider}
          </div>
          <div class="mb-2">
            <span class="font-semibold">Gas Limit:</span> ${this.currentConfig.gasLimit.toLocaleString()}
          </div>
          <div class="mb-2">
            <span class="font-semibold">Gas Price:</span> ${this.currentConfig.gasPrice} Gwei
          </div>
        </div>
      `;
    }
    
    // Update form defaults for new/edit config
    const configNameInput = document.getElementById('configName');
    const configDescInput = document.getElementById('configDescription');
    const networkIdInput = document.getElementById('networkId');
    const providerInput = document.getElementById('providerUrl');
    const gasLimitInput = document.getElementById('gasLimit');
    const gasPriceInput = document.getElementById('gasPrice');
    
    if (configNameInput && this.currentConfig) {
      configNameInput.value = this.currentConfig.name;
    }
    
    if (configDescInput && this.currentConfig) {
      configDescInput.value = this.currentConfig.description || '';
    }
    
    if (networkIdInput && this.currentConfig) {
      networkIdInput.value = this.currentConfig.networkId;
    }
    
    if (providerInput && this.currentConfig) {
      providerInput.value = this.currentConfig.provider;
    }
    
    if (gasLimitInput && this.currentConfig) {
      gasLimitInput.value = this.currentConfig.gasLimit;
    }
    
    if (gasPriceInput && this.currentConfig) {
      gasPriceInput.value = this.currentConfig.gasPrice;
    }
  }

  /**
   * Update the deployment stats UI
   */
  updateStatsUI() {
    const statsDisplay = document.getElementById('deploymentStatsDisplay');
    if (!statsDisplay) return;
    
    if (this.deploymentStats.deployments.length === 0) {
      statsDisplay.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No deployment statistics available</p>';
      return;
    }
    
    // Format the most recent deployment
    let deploymentsHtml = '';
    this.deploymentStats.deployments.forEach((deployment, index) => {
      const date = new Date(deployment.timestamp);
      const dateString = date.toLocaleDateString();
      const timeString = date.toLocaleTimeString();
      
      deploymentsHtml += `
        <div class="mb-4 p-3 ${index === 0 ? 'border-green-500 dark:border-green-400' : 'border-gray-200 dark:border-gray-700'} border rounded-lg">
          <div class="font-medium mb-1">${deployment.contractName || 'Contract'} Deployment</div>
          <div class="text-sm text-gray-600 dark:text-gray-300">${dateString} ${timeString}</div>
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div><span class="font-medium">Contract Address:</span><br>${deployment.contractAddress || 'N/A'}</div>
            <div><span class="font-medium">Network:</span><br>${deployment.networkName || deployment.networkId || 'Unknown'}</div>
            <div><span class="font-medium">Gas Used:</span><br>${deployment.gasUsed?.toLocaleString() || 'N/A'}</div>
            <div><span class="font-medium">Gas Price:</span><br>${deployment.gasPrice || 'N/A'} Gwei</div>
            <div><span class="font-medium">Cost:</span><br>${deployment.cost || 'N/A'} ETH</div>
            <div><span class="font-medium">Block Number:</span><br>${deployment.blockNumber || 'N/A'}</div>
          </div>
        </div>
      `;
    });
    
    // Summary statistics
    const summaryHtml = `
      <div class="mb-4">
        <h3 class="font-semibold text-lg mb-2">Deployment Summary</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Deployments</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.deploymentStats.totalDeployments}</div>
          </div>
          <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Gas Used</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.deploymentStats.totalGasUsed.toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;
    
    // Combine all parts
    statsDisplay.innerHTML = `
      ${summaryHtml}
      <h3 class="font-semibold text-lg mb-2">Recent Deployments</h3>
      ${deploymentsHtml}
    `;
  }

  /**
   * Handle form submission for creating/editing a configuration
   */
  handleConfigFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const configName = form.querySelector('#configName').value.trim();
    const configDesc = form.querySelector('#configDescription').value.trim();
    const networkId = form.querySelector('#networkId').value.trim();
    const provider = form.querySelector('#providerUrl').value.trim();
    const gasLimit = parseInt(form.querySelector('#gasLimit').value, 10);
    const gasPrice = parseInt(form.querySelector('#gasPrice').value, 10);
    
    if (!configName) {
      alert('Configuration name is required');
      return;
    }
    
    if (!networkId) {
      alert('Network ID is required');
      return;
    }
    
    if (!provider) {
      alert('Provider URL is required');
      return;
    }
    
    // Create/update config
    const config = {
      name: configName,
      description: configDesc,
      networkId,
      provider,
      gasLimit: isNaN(gasLimit) ? 5000000 : gasLimit,
      gasPrice: isNaN(gasPrice) ? 20 : gasPrice,
      accounts: {
        deployer: '0',
        admin: '0'
      },
      contracts: {}
    };
    
    try {
      this.addConfig(config);
      alert(`Configuration "${configName}" saved successfully`);
      
      // Close modal if exists
      const modal = document.getElementById('configModal');
      if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
      }
    } catch (error) {
      alert(`Error saving configuration: ${error.message}`);
    }
  }
}

// Export the deployment config manager
window.DeploymentConfigManager = DeploymentConfigManager; 