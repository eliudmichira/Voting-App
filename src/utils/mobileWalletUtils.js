import { Platform, Linking } from 'react-native';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

/**
 * Utility functions for blockchain wallet integration in mobile
 */
const mobileWalletUtils = {
  /**
   * WalletConnect instance
   */
  connector: null,

  /**
   * Initialize WalletConnect
   * @returns {Promise<void>}
   */
  initWalletConnect: async () => {
    // Skip if running on web platform
    if (Platform.OS === 'web') {
      console.log("WalletConnect not initialized on web platform - use web3 plugins directly");
      return;
    }

    try {
      // Only initialize if not already initialized
      if (mobileWalletUtils.connector) {
        return;
      }
      
      // Create a connector with explicit configuration for React Native
      mobileWalletUtils.connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org",
        qrcodeModal: QRCodeModal,
        clientMeta: {
          description: "Blockchain-Based Electoral Management System",
          url: "https://github.com/eliudmichira/BBVMS",
          icons: ["https://walletconnect.org/walletconnect-logo.png"],
          name: "BBVMS",
        },
      });

      console.log("WalletConnect initialized successfully");

      // Subscribe to connection events
      mobileWalletUtils.connector.on("connect", (error, payload) => {
        if (error) {
          console.error("WalletConnect connect error:", error);
          return;
        }
        console.log("WalletConnect connected:", payload);
      });

      mobileWalletUtils.connector.on("session_update", (error, payload) => {
        if (error) {
          console.error("WalletConnect session update error:", error);
          return;
        }
        console.log("WalletConnect session updated:", payload);
      });

      mobileWalletUtils.connector.on("disconnect", (error, payload) => {
        if (error) {
          console.error("WalletConnect disconnect error:", error);
          return;
        }
        console.log("WalletConnect disconnected");
      });
    } catch (error) {
      console.error("WalletConnect initialization error:", error);
    }
  },

  /**
   * Connect to wallet using WalletConnect
   */
  connectWithWalletConnect: async () => {
    // Skip if running on web platform
    if (Platform.OS === 'web') {
      console.log("WalletConnect connection not supported on web platform - use MetaMask browser extension");
      return null;
    }

    try {
      if (!mobileWalletUtils.connector) {
        await mobileWalletUtils.initWalletConnect();
      }

      // If already connected, return account
      if (mobileWalletUtils.connector.connected) {
        const { accounts } = mobileWalletUtils.connector;
        console.log("Already connected to WalletConnect. Accounts:", accounts);
        return accounts[0];
      }

      console.log("Creating new WalletConnect session...");
      
      // Create new session with timeout handling
      const connectPromise = new Promise((resolve, reject) => {
        try {
          // Create session
          mobileWalletUtils.connector.createSession().then(() => {
            console.log("WalletConnect session created");
            
            // Set up a one-time connect event handler to resolve the promise
            const onConnectOnce = (error, payload) => {
              if (error) {
                reject(error);
                return;
              }
              
              const { accounts } = payload.params[0];
              console.log("WalletConnect connected accounts:", accounts);
              if (accounts && accounts.length > 0) {
                resolve(accounts[0]);
              } else {
                reject(new Error("No accounts found after connection"));
              }
            };
            
            mobileWalletUtils.connector.on("connect", onConnectOnce);
          });
        } catch (error) {
          console.error("Error in createSession:", error);
          reject(error);
        }
      });
      
      // Set a 2-minute timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("WalletConnect connection timed out"));
        }, 120000); // 2 minutes
      });
      
      // Race the connection against the timeout
      return await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      console.error("WalletConnect connection error:", error);
      return null;
    }
  },

  /**
   * Try to open MetaMask mobile app
   * @param {string} dappUrl - URL of the dApp
   * @returns {Promise<boolean>} Whether opened successfully
   */
  openMetaMaskApp: async (dappUrl) => {
    // Skip if running on web platform
    if (Platform.OS === 'web') {
      console.log("MetaMask deep linking not supported on web platform");
      return false;
    }

    try {
      // Format dappUrl properly - remove http/https prefix for deep linking
      const formattedUrl = dappUrl.replace(/^https?:\/\//, '');
      const metaMaskUrl = `metamask://dapp/${formattedUrl}`;
      
      console.log(`Attempting to open MetaMask with URL: ${metaMaskUrl}`);
      
      const canOpen = await Linking.canOpenURL(metaMaskUrl);
      
      if (canOpen) {
        console.log("Opening MetaMask app...");
        await Linking.openURL(metaMaskUrl);
        return true;
      }
      
      console.log("Cannot open MetaMask app. Not installed or URL scheme not registered.");
      return false;
    } catch (error) {
      console.error("Error opening MetaMask:", error);
      return false;
    }
  },

  /**
   * Open app store to download MetaMask
   */
  openMetaMaskAppStore: () => {
    // Skip if running on web platform
    if (Platform.OS === 'web') {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/us/app/metamask/id1438144202'
      : 'https://play.google.com/store/apps/details?id=io.metamask';
    
    console.log(`Opening app store: ${storeUrl}`);
    Linking.openURL(storeUrl).catch(err => {
      console.error("Error opening app store:", err);
    });
  },

  /**
   * Sign a message with WalletConnect
   * @param {string} message - Message to sign
   * @returns {Promise<string>} Signature
   */
  signMessage: async (message) => {
    // Skip if running on web platform
    if (Platform.OS === 'web') {
      console.log("Signing messages not supported on web platform via WalletConnect");
      throw new Error("WalletConnect not supported on web platform");
    }

    try {
      if (!mobileWalletUtils.connector || !mobileWalletUtils.connector.connected) {
        throw new Error("Wallet not connected");
      }

      const address = mobileWalletUtils.connector.accounts[0];
      console.log(`Signing message with address ${address}: ${message}`);
      
      // Create a promise that will resolve with the signature
      return new Promise((resolve, reject) => {
        mobileWalletUtils.connector.signPersonalMessage([message, address])
          .then(result => {
            console.log("Message signed successfully:", result);
            resolve(result);
          })
          .catch(error => {
            console.error("Error signing message:", error);
            reject(error);
          });
      });
    } catch (error) {
      console.error("Error in signMessage function:", error);
      throw error;
    }
  },

  /**
   * Disconnect from WalletConnect
   */
  disconnect: async () => {
    // Skip if running on web platform
    if (Platform.OS === 'web' || !mobileWalletUtils.connector) {
      return;
    }

    if (mobileWalletUtils.connector.connected) {
      try {
        console.log("Disconnecting WalletConnect session...");
        await mobileWalletUtils.connector.killSession();
        console.log("WalletConnect session disconnected");
      } catch (error) {
        console.error("Error disconnecting WalletConnect:", error);
      }
    }
  },

  /**
   * Format a wallet address for display
   * @param {string} address - Wallet address
   * @param {number} startChars - Number of characters to show at start
   * @param {number} endChars - Number of characters to show at end
   * @returns {string} Formatted address
   */
  formatAddress: (address, startChars = 6, endChars = 4) => {
    if (!address) return '';
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
  }
};

export default mobileWalletUtils; 