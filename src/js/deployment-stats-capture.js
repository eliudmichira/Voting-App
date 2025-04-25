/**
 * Deployment Statistics Capture
 * 
 * Captures and analyzes deployment statistics from Truffle migrations.
 * Works with the DeploymentConfigManager to provide comprehensive deployment tracking.
 */

class DeploymentStatsCapture {
  constructor(deploymentConfigManager) {
    this.configManager = deploymentConfigManager;
    this.lastCapture = null;
  }

  /**
   * Fetch and parse the latest migration log
   */
  async captureFromMigrationLog() {
    try {
      // Fetch the migration log
      const response = await fetch('/latest-migration.log');
      if (!response.ok) {
        throw new Error(`Failed to load migration log: ${response.statusText}`);
      }
      
      const logContent = await response.text();
      return this.parseDeploymentStats(logContent);
    } catch (error) {
      console.error('Error capturing migration stats:', error);
      return null;
    }
  }
  
  /**
   * Parse deployment statistics from migration log content
   */
  parseDeploymentStats(logContent) {
    if (!logContent) return null;
    
    const stats = {
      contractName: null,
      contractAddress: null,
      deployer: null,
      networkId: null,
      networkName: null,
      gasUsed: 0,
      gasPrice: 0,
      blockNumber: null,
      timestamp: Date.now(),
      transactionHash: null,
      cost: null
    };
    
    // Extract contract name and address
    const contractAddressMatch = logContent.match(/contract address:\s+([0-9a-fA-Fx]+)/i);
    if (contractAddressMatch) {
      stats.contractAddress = contractAddressMatch[1];
    }
    
    // Extract contract name - look for "Deploying 'ContractName'"
    const contractNameMatch = logContent.match(/Deploying\s+'([^']+)'/);
    if (contractNameMatch) {
      stats.contractName = contractNameMatch[1];
    }
    
    // Extract network ID
    const networkIdMatch = logContent.match(/Network:\s+([^\s]+)\s+\(id:\s+(\d+)\)/i);
    if (networkIdMatch) {
      stats.networkName = networkIdMatch[1];
      stats.networkId = networkIdMatch[2];
    }
    
    // Extract gas used
    const gasUsedMatch = logContent.match(/gas used:\s+([\d,]+)/i);
    if (gasUsedMatch) {
      stats.gasUsed = parseInt(gasUsedMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract gas price if available
    const gasPriceMatch = logContent.match(/gas price:\s+([\d.]+)\s+gwei/i);
    if (gasPriceMatch) {
      stats.gasPrice = parseFloat(gasPriceMatch[1]);
    }
    
    // Extract block number
    const blockNumberMatch = logContent.match(/block:\s+(\d+)/i);
    if (blockNumberMatch) {
      stats.blockNumber = parseInt(blockNumberMatch[1], 10);
    }
    
    // Extract transaction hash
    const txHashMatch = logContent.match(/transaction hash:\s+([0-9a-fA-Fx]+)/i);
    if (txHashMatch) {
      stats.transactionHash = txHashMatch[1];
    }
    
    // Calculate cost if we have gas used and gas price
    if (stats.gasUsed && stats.gasPrice) {
      // Gas price is in gwei, convert to ETH
      stats.cost = (stats.gasUsed * stats.gasPrice * 1e-9).toFixed(6);
    }
    
    // If we found a contract address but missed some data, set defaults
    if (stats.contractAddress) {
      if (!stats.contractName) stats.contractName = 'Unknown Contract';
      if (!stats.networkName) stats.networkName = 'Unknown Network';
      if (!stats.gasPrice) stats.gasPrice = 20; // Default gas price
      
      this.lastCapture = stats;
      
      // Save to deployment manager if available
      if (this.configManager) {
        this.configManager.addDeploymentStat(stats);
      }
    }
    
    return stats;
  }
  
  /**
   * Get the most recent deployment capture
   */
  getLastCapture() {
    return this.lastCapture;
  }
  
  /**
   * Get formatted HTML summary of the last deployment
   */
  getFormattedSummary() {
    if (!this.lastCapture) return '<p>No deployment data available</p>';
    
    const stats = this.lastCapture;
    const date = new Date(stats.timestamp);
    
    return `
      <div class="p-4 border border-green-500 dark:border-green-400 rounded-lg mb-4 bg-green-50 dark:bg-green-900/20">
        <h3 class="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
          ${stats.contractName} Deployed Successfully
        </h3>
        <div class="text-sm text-gray-600 dark:text-gray-300 mb-3">
          ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 dark:text-gray-400">Contract Address</span>
            <span class="font-mono text-sm">${stats.contractAddress}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 dark:text-gray-400">Network</span>
            <span>${stats.networkName} (ID: ${stats.networkId})</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 dark:text-gray-400">Gas Used</span>
            <span>${stats.gasUsed?.toLocaleString() || 'N/A'}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 dark:text-gray-400">Gas Price</span>
            <span>${stats.gasPrice || 'N/A'} Gwei</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 dark:text-gray-400">Cost</span>
            <span>${stats.cost || 'N/A'} ETH</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 dark:text-gray-400">Block Number</span>
            <span>${stats.blockNumber || 'N/A'}</span>
          </div>
        </div>
        ${stats.transactionHash ? `
          <div class="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
            <span class="text-xs text-gray-500 dark:text-gray-400">Transaction Hash</span>
            <a href="https://etherscan.io/tx/${stats.transactionHash}" target="_blank" class="block font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ${stats.transactionHash}
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Export the deployment stats capture
window.DeploymentStatsCapture = DeploymentStatsCapture; 