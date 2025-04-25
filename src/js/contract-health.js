/**
 * Contract Health Monitor
 * 
 * Monitors contract health, accessibility, and estimates gas costs for operations.
 */

class ContractHealthMonitor {
  constructor(web3Instance, contractInstance) {
    this.web3 = web3Instance;
    this.contract = contractInstance;
    this.isActive = false;
    this.healthStatus = 'unknown';
    this.lastChecked = null;
    this.gasEstimates = {};
    this.intervalId = null;
  }

  // Start monitoring contract health
  async start() {
    if (this.isActive) return;
    
    this.isActive = true;
    await this.checkHealth();
    await this.estimateGasCosts();
    
    // Check health every 30 seconds
    this.intervalId = setInterval(async () => {
      await this.checkHealth();
      // Estimate gas costs less frequently (every 2 minutes)
      if (Date.now() - this.lastGasCheck > 120000) {
        await this.estimateGasCosts();
      }
    }, 30000);
    
    return this.healthStatus;
  }
  
  // Stop monitoring
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
  }
  
  // Check if contract is accessible
  async checkHealth() {
    try {
      // Try to call a simple view function to test contract availability
      await this.contract.methods.candidateCount().call();
      this.healthStatus = 'healthy';
    } catch (error) {
      console.error('Contract health check failed:', error);
      this.healthStatus = 'unhealthy';
    }
    
    this.lastChecked = Date.now();
    this.updateHealthDisplay();
    return this.healthStatus;
  }
  
  // Estimate gas costs for common operations
  async estimateGasCosts() {
    if (!this.web3 || !this.contract) return;
    
    this.lastGasCheck = Date.now();
    const accounts = await this.web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) return;
    
    try {
      // Get current gas price
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');
      
      // Estimate gas for adding candidate
      const addCandidateGas = await this.contract.methods
        .addCandidate('Candidate Name', 'Party')
        .estimateGas({ from: accounts[0] })
        .catch(() => 'N/A');
        
      // Estimate gas for voting
      const voteGas = await this.contract.methods
        .vote(1)
        .estimateGas({ from: accounts[0] })
        .catch(() => 'N/A');
        
      // Estimate gas for setting voting period
      const now = Math.floor(Date.now() / 1000);
      const setVotingPeriodGas = await this.contract.methods
        .setVotingPeriod(now, now + 3600)
        .estimateGas({ from: accounts[0] })
        .catch(() => 'N/A');
      
      // Calculate costs in ETH
      this.gasEstimates = {
        gasPrice: gasPriceGwei,
        operations: {
          addCandidate: {
            gas: addCandidateGas,
            cost: addCandidateGas !== 'N/A' 
              ? this.web3.utils.fromWei((addCandidateGas * gasPrice).toString(), 'ether') 
              : 'N/A'
          },
          vote: {
            gas: voteGas,
            cost: voteGas !== 'N/A' 
              ? this.web3.utils.fromWei((voteGas * gasPrice).toString(), 'ether') 
              : 'N/A'
          },
          setVotingPeriod: {
            gas: setVotingPeriodGas,
            cost: setVotingPeriodGas !== 'N/A' 
              ? this.web3.utils.fromWei((setVotingPeriodGas * gasPrice).toString(), 'ether') 
              : 'N/A'
          }
        }
      };
      
      this.updateGasDisplay();
    } catch (error) {
      console.error('Failed to estimate gas costs:', error);
    }
  }
  
  // Update health status display
  updateHealthDisplay() {
    const healthIndicator = document.getElementById('contractHealthIndicator');
    if (!healthIndicator) return;
    
    // Update status indicator
    healthIndicator.classList.remove('bg-gray-400', 'bg-green-500', 'bg-red-500');
    
    if (this.healthStatus === 'healthy') {
      healthIndicator.classList.add('bg-green-500');
      healthIndicator.setAttribute('title', 'Contract is accessible and functioning properly');
    } else if (this.healthStatus === 'unhealthy') {
      healthIndicator.classList.add('bg-red-500');
      healthIndicator.setAttribute('title', 'Contract is not accessible');
    } else {
      healthIndicator.classList.add('bg-gray-400');
      healthIndicator.setAttribute('title', 'Contract health unknown');
    }
    
    // Update last checked time
    const lastCheckedElement = document.getElementById('lastHealthCheck');
    if (lastCheckedElement && this.lastChecked) {
      const formattedTime = new Date(this.lastChecked).toLocaleTimeString();
      lastCheckedElement.textContent = `Last checked: ${formattedTime}`;
    }
  }
  
  // Update gas cost display
  updateGasDisplay() {
    const gasDisplay = document.getElementById('gasCostDisplay');
    if (!gasDisplay) return;
    
    gasDisplay.innerHTML = `
      <div class="mb-2">
        <span class="font-semibold">Current Gas Price:</span> 
        ${this.gasEstimates.gasPrice} Gwei
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="font-medium">Add Candidate:</span><br>
          Gas: ${this.gasEstimates.operations?.addCandidate?.gas || 'N/A'}<br>
          Cost: ${this.gasEstimates.operations?.addCandidate?.cost || 'N/A'} ETH
        </div>
        <div>
          <span class="font-medium">Vote:</span><br>
          Gas: ${this.gasEstimates.operations?.vote?.gas || 'N/A'}<br>
          Cost: ${this.gasEstimates.operations?.vote?.cost || 'N/A'} ETH
        </div>
        <div>
          <span class="font-medium">Set Voting Period:</span><br>
          Gas: ${this.gasEstimates.operations?.setVotingPeriod?.gas || 'N/A'}<br>
          Cost: ${this.gasEstimates.operations?.setVotingPeriod?.cost || 'N/A'} ETH
        </div>
      </div>
    `;
  }
  
  // Get the current health status
  getHealthStatus() {
    return {
      status: this.healthStatus,
      lastChecked: this.lastChecked,
      gasEstimates: this.gasEstimates
    };
  }
}

// Export the health monitor
window.ContractHealthMonitor = ContractHealthMonitor; 