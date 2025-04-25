/**
 * Contract Loader
 * 
 * This module dynamically loads the latest Voting contract deployed with Truffle.
 * It reads the contract information from the build files to get the latest address.
 */

// Function to load the latest contract address
async function loadContractAddress() {
  try {
    console.log('Loading latest contract address from build files...');
    
    // Fetch the Voting.json file from the build directory
    const response = await fetch('/build/contracts/Voting.json');
    if (!response.ok) {
      throw new Error(`Failed to load contract data: ${response.statusText}`);
    }
    
    const contractData = await response.json();
    
    // Extract network information
    const networks = contractData.networks;
    if (!networks || Object.keys(networks).length === 0) {
      throw new Error('No networks found in contract data. Has the contract been deployed?');
    }
    
    // Get the latest network ID (usually the highest number in Truffle deployments)
    const networkIds = Object.keys(networks).map(id => parseInt(id));
    const latestNetworkId = Math.max(...networkIds).toString();
    
    // Get the contract address from the latest network
    const contractAddress = networks[latestNetworkId].address;
    if (!contractAddress) {
      throw new Error('Contract address not found in the build file');
    }
    
    console.log(`Loaded contract address: ${contractAddress} from network ID: ${latestNetworkId}`);
    return contractAddress;
  } catch (error) {
    console.error('Error loading contract address:', error);
    throw error;
  }
}

// Export the loader function
window.contractLoader = {
  loadContractAddress
}; 