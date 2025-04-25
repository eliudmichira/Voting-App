// Service definitions to fix ESLint errors
const ConfigService = {
  getApiUrl: function() {
    return localStorage.getItem('apiUrl') || 'http://localhost:8000';
  },
  setApiUrl: function(url) {
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    localStorage.setItem('apiUrl', cleanUrl);
  },
  API_ENDPOINTS: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    PROFILE: '/api/profile',
    ELECTIONS: '/api/elections',
    VOTE: '/api/vote'
  },
  getFullEndpoint: function(endpoint) {
    return this.getApiUrl() + endpoint;
  }
};

const DebugService = {
  log: function(message, data) {
    if (localStorage.getItem('debug') === 'true') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  error: function(message, error) {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: function(message, data) {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

class AuthService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  saveUserInfo(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  getUserInfo() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}

const UIService = {
  showFeedback: function(element, options) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    
    if (!element) return;
    
    const message = typeof options === 'object' ? options.message : options;
    const isError = typeof options === 'object' ? options.status === 'error' : false;
    
    // Clear existing classes
    element.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'dark:bg-green-900', 'dark:text-green-300', 'dark:bg-red-900', 'dark:text-red-300');
    
    // Set new text and classes
    element.textContent = message;
    
    if (isError) {
      element.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-300');
    } else {
      element.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-300');
    }
    
    // Ensure element is visible
    element.classList.remove('hidden');
  },
  
  setLoading: function(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      button._originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<div class="loader"></div><span>Processing...</span>';
    } else {
      button.disabled = false;
      button.innerHTML = button._originalText || 'Submit';
    }
  }
};

// Helper functions
function showFeedback(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Clear existing classes
  element.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'dark:bg-green-900', 'dark:text-green-300', 'dark:bg-red-900', 'dark:text-red-300');
  
  // Set new text and classes
  element.textContent = message;
  
  if (isError) {
    element.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-300');
  } else {
    // For success, use green background
    element.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-300');
  }
  
  // Ensure element is visible
  element.classList.remove('hidden');
}

function setLoading(button, isLoading) {
  UIService.setLoading(button, isLoading);
}

function formatWalletAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// eslint-disable-next-line no-unused-vars
function updateParticlesTheme() {
  if (typeof updateParticlesColors === 'function') {
    updateParticlesColors();
  }
}

// WalletService with improved error handling and compatibility
class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }
  
  async connect(silent = false) {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask to use this application.");
    }
    
    try {
      // Check if already connected
      if (this.isConnected()) {
        return await this.getAddress();
      }
      
      // Silent mode doesn't prompt if not already connected
      if (silent) {
        const accounts = await window.ethereum.request({ 
          method: "eth_accounts" 
        });
        
        if (accounts && accounts.length > 0) {
          // Initialize provider and signer with existing connection
          try {
            // Try to use ethers BrowserProvider
            if (window.ethers && window.ethers.BrowserProvider) {
              this.provider = new window.ethers.BrowserProvider(window.ethereum);
              this.signer = await this.provider.getSigner();
            } else {
              // Fallback for older ethers versions or when not available
              console.log("Using fallback provider method");
              this.provider = { 
                getAddress: () => accounts[0],
                signMessage: async (msg) => window.ethereum.request({
                  method: 'personal_sign',
                  params: [msg, accounts[0]]
                })
              };
              this.signer = this.provider;
            }
            return accounts[0];
          } catch (err) {
            console.error("Error initializing provider:", err);
            return accounts[0]; // Return address even if provider fails
          }
        }
        return null;
      }
      
      // Request account access - this triggers the MetaMask popup
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }
      
      // Initialize provider and signer
      try {
        if (window.ethers && window.ethers.BrowserProvider) {
          this.provider = new window.ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
        } else {
          // Fallback implementation
          this.provider = { 
            getAddress: () => accounts[0],
            signMessage: async (msg) => window.ethereum.request({
              method: 'personal_sign',
              params: [msg, accounts[0]]
            })
          };
          this.signer = this.provider;
        }
      } catch (err) {
        console.error("Error initializing ethers provider:", err);
        // Create minimal provider/signer that just has the address
        this.provider = { getAddress: () => accounts[0] };
        this.signer = this.provider;
      }
      
      return accounts[0];
    } catch (error) {
      // Clear provider and signer on error
      this.provider = null;
      this.signer = null;
      
      if (silent) {
        // Don't throw in silent mode
        return null;
      }
      
      throw new Error(error.message || "Failed to connect to MetaMask");
    }
  }
  
  async getAddress() {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      if (typeof this.signer.getAddress === 'function') {
        return await this.signer.getAddress();
      } else if (window.ethereum && window.ethereum.selectedAddress) {
        return window.ethereum.selectedAddress;
      } else {
        throw new Error("Cannot get wallet address");
      }
    } catch (error) {
      console.error("Error getting address:", error);
      throw new Error("Failed to get wallet address");
    }
  }
  
  isConnected() {
    return !!this.signer;
  }
}

// Enhanced API Service with better error handling
class ApiService {
  constructor() {
    // Import ConfigService at the top of the file
    this.baseUrl = window.ConfigService?.getApiUrl() || '/api'; // Fallback to default if ConfigService not available
    this.connectionRetries = 0;
    this.maxRetries = 3;
  }
  async testConnection() {
    try {
      // Try direct connection first
      const directUrl = 'http://localhost:8000/api-test';
      try {
        console.log(`Testing direct connection with ${directUrl}`);
        const directResponse = await fetch(directUrl, { 
          mode: 'cors',
          headers: { 'Accept': 'application/json' },
          // Add a timeout using AbortController
          signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : null
        });
        
        if (directResponse.ok) {
          ConfigService.setApiUrl('http://localhost:8000');
          DebugService.log("Direct connection successful");
          return { success: true, type: 'direct' };
        }
      } catch (directError) {
        DebugService.log("Direct connection failed", directError);
      }
      
      // Then try proxy connection
      const proxyUrl = '/proxy/api-test';
      try {
        DebugService.log(`Testing proxy connection with ${proxyUrl}`);
        const proxyResponse = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' },
          // Add a timeout
          signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : null
        });
        
        if (proxyResponse.ok) {
          ConfigService.setApiUrl('/proxy');
          DebugService.log("Proxy connection successful");
          return { success: true, type: 'proxy' };
        }
      } catch (proxyError) {
        DebugService.log("Proxy connection failed", proxyError);
      }
      
      // If we get here, no connection was successful
      return { 
        success: false, 
        type: null, 
        message: "Could not connect to API through direct or proxy methods" 
      };
    } catch (error) {
      DebugService.log("Connection test error", error);
      return { 
        success: false, 
        type: null, 
        error: error.message || "Unknown connection error" 
      };
    }
  }
  
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    // Add CSRF token if available
    const csrfTokenElement = document.getElementById('csrf-token');
    if (csrfTokenElement && csrfTokenElement.content) {
      options.headers['X-CSRF-Token'] = csrfTokenElement.content;
    }
    
    DebugService.log(`API ${method} request to ${url}`, { body });
    
    try {
      // Add timeout for fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      options.signal = controller.signal;
      
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      // Get response as text first
      const responseText = await response.text();
      
      // Try to parse JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        data = { message: responseText || "Invalid JSON response" };
      }
      
      if (!response.ok) {
        throw new Error(data.message || data.detail || `Request failed with status ${response.status}`);
      }
      
      // Reset retry counter on success
      this.connectionRetries = 0;
      return data;
    } catch (error) {
      // Check if this is a network error and we should retry
      if (error.name === 'TypeError' && this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        DebugService.log(`Network error, retrying (${this.connectionRetries}/${this.maxRetries})...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(endpoint, method, body);
      }
      
      DebugService.log(`API request failed: ${error.message}`);
      throw error;
    }
  }
  
  // Improved login method with better validation
  async login(nationalId, password, walletAddress) {
    try {
      // Get correct endpoint without duplication
      const baseUrl = ConfigService.getApiUrl();
      const endpoint = ConfigService.API_ENDPOINTS.LOGIN;
      
      // Create full URL while preventing double /api/
      let apiUrl;
      if (baseUrl.endsWith('/api') && endpoint.startsWith('/api/')) {
        // Remove duplicate /api
        apiUrl = baseUrl + endpoint.substring(4);
      } else {
        apiUrl = baseUrl + endpoint;
      }
      
      // Debug the URL
      debugApiCall(apiUrl, 'POST', { nationalId, password, walletAddress: walletAddress || null });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nationalId,
          password,
          walletAddress
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Login failed with status: ${response.status}`);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid National ID or password. Please try again.');
        } else if (response.status === 403) {
          throw new Error('Your account is locked or disabled. Please contact support.');
        } else {
          throw new Error(`Login failed with status: ${response.status}`);
        }
      }
      
      // Parse the response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}

// Fixed Login Manager with better authentication state management
class LoginManager {
  constructor() {
    this.apiService = new ApiService();
    this.walletService = new WalletService();
    this.authService = new AuthService(ConfigService.getApiUrl());
    
    // Authentication state tracking
    this.isAuthenticated = false;
    this.isWalletConnected = false;
    this.walletAddress = null;
    
    // Debug setup
    this.createDebugPanel();
    
    // Initialize UI state
    this.isRegistrationModalOpen = false;
    this.currentLoginStep = 1;
  }
  
  // Fixed method to ensure consistent authentication state
  ensureConsistentAuthState(loginResult) {
    // Clear any existing auth data first
    this.clearAuthState();
    
    // Set core authentication values
    localStorage.setItem('token', loginResult.token);
    localStorage.setItem('user_id', loginResult.user.id || loginResult.user.nationalId);
    localStorage.setItem('user_role', loginResult.user.role);
    localStorage.setItem('nationalId', loginResult.user.nationalId);
    localStorage.setItem('walletAddress', loginResult.user.walletAddress || this.walletAddress);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('login_timestamp', Date.now().toString());
    
    // Set compatibility values for different parts of the application
    localStorage.setItem('auth_token', loginResult.token);
    localStorage.setItem('role', loginResult.user.role);
    localStorage.setItem('voterId', loginResult.user.nationalId);
    
    // Set session flags for authentication tracking
    sessionStorage.setItem('JUST_LOGGED_IN', 'true');
    sessionStorage.setItem('LOGIN_TIME', Date.now().toString());
    
    // Reset any redirect counters
    sessionStorage.removeItem('redirectCounter');
    
    // Use the authService to save user info
    this.authService.saveUserInfo(loginResult.user);
    
    // Set auth cookies for additional verification
    this.setAuthCookies(loginResult);
    
    // Update instance state
    this.isAuthenticated = true;
    
    // Log authentication state for debugging
    DebugService.log("Authentication state established", {
      token: "present",
      id: loginResult.user.id || loginResult.user.nationalId,
      role: loginResult.user.role,
      timestamp: new Date().toISOString()
    });
  }
  
  // Helper to clear all auth state
  clearAuthState() {
    // Clear localStorage auth items
    const authKeys = [
      'token', 'auth_token', 'user_id', 'user_role', 'role',
      'nationalId', 'national_id', 'voterId', 'walletAddress',
      'wallet_address', 'isAuthenticated', 'login_timestamp'
    ];
    
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage
    sessionStorage.removeItem('JUST_LOGGED_IN');
    sessionStorage.removeItem('LOGIN_TIME');
    sessionStorage.removeItem('redirectCounter');
    
    // Clear auth cookies
    this.clearAuthCookies();
    
    // Update instance state
    this.isAuthenticated = false;
  }
  
  // Helper to set auth cookies
  setAuthCookies(loginResult) {
    const loginTime = Date.now();
    const cookieOptions = "; path=/; max-age=3600; SameSite=Lax";
    
    document.cookie = `auth_verified=true${cookieOptions}`;
    document.cookie = `auth_time=${loginTime}${cookieOptions}`;
    document.cookie = `auth_user_id=${loginResult.user.id || loginResult.user.nationalId}${cookieOptions}`;
    document.cookie = `auth_role=${loginResult.user.role}${cookieOptions}`;
  }
  
  // Helper to clear auth cookies
  clearAuthCookies() {
    const pastDate = "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    
    document.cookie = `auth_verified=false${pastDate}`;
    document.cookie = `auth_time=0${pastDate}`;
    document.cookie = `auth_user_id=${pastDate}`;
    document.cookie = `auth_role=${pastDate}`;
  }
  
  // Fixed method for wallet connection with better error handling
  async connectWallet(context = 'login', silent = false) {
    const connectButton = context === 'login' 
      ? document.getElementById('connectWalletBtn')
      : document.getElementById('registerConnectWalletBtn');
    
    const addressElement = context === 'login'
      ? document.getElementById('walletAddress')
      : document.getElementById('registerWalletAddress');
    
    const notConnectedElement = context === 'login'
      ? document.getElementById('walletNotConnected')
      : document.getElementById('registerWalletNotConnected');
    
    const connectedElement = context === 'login'
      ? document.getElementById('walletConnected')
      : document.getElementById('registerWalletConnected');
    
    const feedbackElement = context === 'login'
      ? document.getElementById('loginFeedback')
      : document.getElementById('registerFeedback');
    
    if (!connectButton || !addressElement || !notConnectedElement || !connectedElement) {
      DebugService.log("Wallet connection UI elements not found");
      return null;
    }
    
    if (!silent) {
      UIService.setLoading(connectButton, true);
    }
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("MetaMask not installed. Please install MetaMask to use this application.");
      }
      
      // Handle existing connections first
      if (this.isWalletConnected && this.walletAddress) {
        addressElement.textContent = this.formatAddress(this.walletAddress);
        notConnectedElement.classList.add('hidden');
        connectedElement.classList.remove('hidden');
        
        if (!silent) {
          UIService.showFeedback(feedbackElement, {
            message: 'Wallet already connected!',
            status: 'success'
          });
        }
        
        UIService.setLoading(connectButton, false);
        return this.walletAddress;
      }
      
      // Connect to wallet
      const address = await this.walletService.connect(silent);
      
      if (!address) {
        if (silent) return null;
        throw new Error("Failed to connect to wallet. Please try again.");
      }
      
      this.walletAddress = address;
      this.isWalletConnected = true;
      
      // Update UI
      addressElement.textContent = this.formatAddress(address);
      notConnectedElement.classList.add('hidden');
      connectedElement.classList.remove('hidden');
      
      if (context === 'login') {
        // Update login steps
        this.currentLoginStep = 2;
        this.updateLoginStepsUI();
        
        if (!silent) {
          UIService.showFeedback(feedbackElement, {
            message: 'Wallet connected! Please enter your password to complete login.',
            status: 'success'
          });
        }
      } else {
        if (!silent) {
          UIService.showFeedback(feedbackElement, {
            message: 'Wallet connected successfully!',
            status: 'success'
          });
        }
      }
      
      // Log wallet connection for debugging
      DebugService.log(`Wallet connected: ${address}`);
      
      return address;
    } catch (error) {
      DebugService.log(`Wallet connection error: ${error.message}`);
      
      this.isWalletConnected = false;
      this.walletAddress = null;
      
      if (!silent) {
        UIService.showFeedback(feedbackElement, {
          message: `Failed to connect wallet: ${error.message}`,
          status: 'error'
        });
      }
      
      return null;
    } finally {
      if (!silent) {
        UIService.setLoading(connectButton, false);
      }
    }
  }
  
  // Fixed method for handling login submission with better validation
  async handleLoginSubmit(event) {
    if (event) event.preventDefault();
    
    const nationalIdInput = document.getElementById('nationalId');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginButton = document.getElementById('loginButton');
    const loginFeedback = document.getElementById('loginFeedback');
    
    if (!nationalIdInput || !passwordInput || !loginButton) {
      DebugService.log("Login form elements not found");
      return;
    }
    
    const nationalId = nationalIdInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox?.checked || false;
    
    // Input validation
    if (!nationalId) {
      UIService.showFeedback(loginFeedback, { 
        message: 'Please enter your National ID', 
        status: 'error'
      });
      nationalIdInput.focus();
      return;
    }
    
    if (!password) {
      UIService.showFeedback(loginFeedback, { 
        message: 'Please enter your password', 
        status: 'error'
      });
      passwordInput.focus();
      return;
    }
    
    // Wallet connection check
    if (!this.isWalletConnected || !this.walletAddress) {
      UIService.showFeedback(loginFeedback, { 
        message: 'Please connect your MetaMask wallet to continue', 
        status: 'error'
      });
      
      // Highlight the connect wallet button
      const connectWalletBtn = document.getElementById('connectWalletBtn');
      if (connectWalletBtn) {
        connectWalletBtn.classList.add('animate-pulse');
        setTimeout(() => {
          connectWalletBtn.classList.remove('animate-pulse');
        }, 2000);
      }
      return;
    }
    
    // Set loading state
    UIService.setLoading(loginButton, true);
    
    try {
      // Attempt login
      const loginResult = await this.apiService.login(nationalId, password, this.walletAddress);
      
      // Ensure we have a valid response
      if (!loginResult || !loginResult.success || !loginResult.token || !loginResult.user) {
        throw new Error("Invalid response from server");
      }
      
      // Establish consistent authentication state
      this.ensureConsistentAuthState(loginResult);
      
      // Handle "remember me" feature
      if (rememberMe) {
        this.saveRememberedId(nationalId);
      } else {
        this.clearRememberedId();
      }
      
      // Show success feedback
      UIService.showFeedback('loginFeedback', {
        message: 'Login successful! Redirecting...',
        status: 'success'
      });
      
      // Determine redirect destination based on user role
      const redirectDestination = loginResult.user.role === 'admin' ? 'admin.html' : 'index.html';
      const timestamp = Date.now();
      
      // Log the redirection for debugging
      DebugService.log(`Redirecting to: ${redirectDestination}?auth=fresh&time=${timestamp}`);
      
      // Execute the redirect after a short delay
      setTimeout(() => {
        window.location.href = `${redirectDestination}?auth=fresh&time=${timestamp}`;
      }, 1500);
    } catch (error) {
      DebugService.log(`Login error: ${error.message}`);
      
      UIService.showFeedback(loginFeedback, {
        message: error.message || 'Login failed. Please try again.',
        status: 'error'
      });
      
      UIService.setLoading(loginButton, false);
    }
  }
  
  // Add this missing method
  createDebugPanel() {
    // Only create debug panel if debug mode is enabled
    if (localStorage.getItem('debug') !== 'true') {
      return;
    }
    
    // Check if panel already exists
    if (document.getElementById('debugPanel')) {
      return;
    }
    
    // Create debug panel elements
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.className = 'hidden';
    
    const debugHeader = document.createElement('div');
    debugHeader.className = 'flex justify-between items-center';
    
    const debugTitle = document.createElement('h3');
    debugTitle.textContent = 'Debug Panel';
    debugTitle.className = 'text-lg font-semibold';
    
    const closeButton = document.createElement('button');
    closeButton.id = 'closeDebugPanel';
    closeButton.innerHTML = '&times;';
    closeButton.className = 'text-2xl';
    closeButton.addEventListener('click', () => {
      debugPanel.classList.add('hidden');
    });
    
    const debugContent = document.createElement('div');
    debugContent.id = 'debugContent';
    
    // Assemble panel
    debugHeader.appendChild(debugTitle);
    debugHeader.appendChild(closeButton);
    debugPanel.appendChild(debugHeader);
    debugPanel.appendChild(debugContent);
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggleDebugPanel';
    toggleButton.textContent = 'Debug';
    toggleButton.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-md text-sm z-50';
    toggleButton.addEventListener('click', () => {
      debugPanel.classList.toggle('hidden');
    });
    
    // Add to document
    document.body.appendChild(debugPanel);
    document.body.appendChild(toggleButton);
    
    // Log initial debug info
    this.logDebugInfo('Debug panel initialized');
  }
  
  // Helper method for logging to debug panel
  logDebugInfo(message, data = null) {
    if (localStorage.getItem('debug') !== 'true') {
      return;
    }
    
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;
    
    const entry = document.createElement('div');
    entry.className = 'debug-entry border-b border-gray-700 py-1';
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const messageText = document.createElement('div');
    messageText.className = 'text-xs';
    messageText.innerHTML = `<span class="text-gray-400">[${timestamp}]</span> ${message}`;
    
    entry.appendChild(messageText);
    
    if (data) {
      const dataText = document.createElement('pre');
      dataText.className = 'text-xs mt-1 pl-4 text-gray-400 overflow-x-auto';
      dataText.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      entry.appendChild(dataText);
    }
    
    debugContent.insertBefore(entry, debugContent.firstChild);
    
    // Limit entries to prevent performance issues
    const maxEntries = 100;
    const entries = debugContent.querySelectorAll('.debug-entry');
    if (entries.length > maxEntries) {
      for (let i = maxEntries; i < entries.length; i++) {
        entries[i].remove();
      }
    }
  }
  
  // Add initialize method if it doesn't exist
  async initialize() {
    try {
      // Check for existing authentication
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id') || localStorage.getItem('nationalId');
      
      if (token && userId) {
        this.isAuthenticated = true;
        DebugService.log('User already authenticated', { userId });
      }
      
      // Try silent wallet connection
      const address = await this.walletService.connect(true);
      if (address) {
        this.walletAddress = address;
        this.isWalletConnected = true;
        DebugService.log('Wallet already connected', { address });
        
        // Update UI if needed
        const walletAddress = document.getElementById('walletAddress');
        const walletNotConnected = document.getElementById('walletNotConnected');
        const walletConnected = document.getElementById('walletConnected');
        
        if (walletAddress) walletAddress.textContent = this.formatAddress(address);
        if (walletNotConnected) walletNotConnected.classList.add('hidden');
        if (walletConnected) walletConnected.classList.remove('hidden');
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      DebugService.error('Error initializing login manager', error);
      return false;
    }
  }
  
  // Add this helper method
  formatAddress(address) {
    return formatWalletAddress(address);
  }
  
  // Add this method to set up event listeners
  setupEventListeners() {
    // Connect wallet button
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
      connectWalletBtn.addEventListener('click', () => this.connectWallet('login'));
    }
    
    // Login button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.addEventListener('click', (e) => this.handleLoginSubmit(e));
    }
    
    // Registration button
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => this.showRegistrationModal());
    }
    
    // Close registration modal
    const closeRegisterBtn = document.getElementById('closeRegisterBtn');
    if (closeRegisterBtn) {
      closeRegisterBtn.addEventListener('click', () => this.hideRegistrationModal());
    }
  }
  
  // Add this method
  showRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
      modal.classList.remove('hidden');
      this.isRegistrationModalOpen = true;
    }
  }
}

// Initialize app safely
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Set theme based on preference
    initializeTheme();
    
    // Initialize login manager
    const loginManager = new LoginManager();
    
    // Make available globally but with controlled interface
    window.loginManager = {
      // Expose only necessary methods
      connectWallet: (context) => loginManager.connectWallet(context),
      showRegistrationModal: () => loginManager.showRegistrationModal(),
      hideRegistrationModal: () => loginManager.hideRegistrationModal(),
      handleLoginSubmit: (e) => loginManager.handleLoginSubmit(e),
      togglePasswordVisibility: (inputId, buttonId) => {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        
        if (!input || !button) return;
        
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
      }
    };
    
    await loginManager.initialize();
    
    // Initialize particles.js if available
    initializeParticles();

    // Check and fix any API URL issues in localStorage
    const storedApiUrl = localStorage.getItem('apiUrl');
    if (storedApiUrl) {
      // If the URL contains duplicate /api segments, fix it
      if (storedApiUrl.includes('/api/api')) {
        const fixedUrl = storedApiUrl.replace('/api/api', '/api');
        localStorage.setItem('apiUrl', fixedUrl);
        console.log(`Fixed API URL from ${storedApiUrl} to ${fixedUrl}`);
      }
      
      // Make sure there's no trailing slash
      if (storedApiUrl.endsWith('/')) {
        const fixedUrl = storedApiUrl.slice(0, -1);
        localStorage.setItem('apiUrl', fixedUrl);
        console.log(`Removed trailing slash from API URL: ${fixedUrl}`);
      }
    }
  } catch (error) {
    console.error("Error initializing application:", error);
    // Show error banner
    const errorBanner = document.createElement('div');
    errorBanner.className = 'p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md fixed top-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg';
    errorBanner.textContent = `Error initializing application: ${error.message}`;
    document.body.appendChild(errorBanner);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      errorBanner.classList.add('fade-out');
      setTimeout(() => errorBanner.remove(), 500);
    }, 10000);
  }
});

// Helper function to initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Setup theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Update button icon on initialization
    updateThemeToggleIcon(themeToggle);
    
    themeToggle.addEventListener('change', function() {
      // Toggle dark class on html element
      document.documentElement.classList.toggle('dark');
      document.body.classList.toggle('dark');
      
      // Save preference to localStorage
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Update particles if needed
      if (typeof updateParticlesColors === 'function') {
        updateParticlesColors();
      }
      
      // Log theme change
      console.log(`Theme changed to ${isDark ? 'dark' : 'light'} mode`);
    });
  }
}

// Helper function to update theme toggle icon
function updateThemeToggleIcon(toggle) {
  // This function is no longer needed with the slider toggle
  // But we keep an empty function to avoid errors in existing code that calls it
  console.log("Theme toggle icon updated (slider version)");
}

// Initialize particles.js
function initializeParticles() {
  const particlesContainer = document.getElementById('particles-js');
  if (particlesContainer && typeof window.particlesJS === 'function') {
    try {
      // Get theme
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Use the isDarkMode variable to set particle colors
      const particleColor = isDarkMode ? '#4ade80' : '#16a34a';
      const particleOpacity = isDarkMode ? 0.4 : 0.3;
      
      window.particlesJS('particles-js', {
        "particles": {
          "number": {
            "value": 80,
            "density": {
              "enable": true,
              "value_area": 800
            }
          },
          "color": {
            "value": particleColor
          },
          "shape": {
            "type": "circle",
            "stroke": {
              "width": 0,
              "color": "#000000"
            }
          },
          "opacity": {
            "value": particleOpacity,
            "random": false,
            "anim": {
              "enable": false,
              "speed": 1,
              "opacity_min": 0.1,
              "sync": false
            }
          },
          "size": {
            "value": 3,
            "random": true,
            "anim": {
              "enable": false,
              "speed": 40,
              "size_min": 0.1,
              "sync": false
            }
          },
          "line_linked": {
            "enable": true,
            "distance": 150,
            "color": particleColor,
            "opacity": 0.2,
            "width": 1
          },
          "move": {
            "enable": true,
            "speed": 2,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
              "enable": false,
              "rotateX": 600,
              "rotateY": 1200
            }
          }
        },
        "interactivity": {
          "detect_on": "canvas",
          "events": {
            "onhover": {
              "enable": true,
              "mode": "grab"
            },
            "onclick": {
              "enable": true,
              "mode": "push"
            },
            "resize": true
          },
          "modes": {
            "grab": {
              "distance": 140,
              "line_linked": {
                "opacity": 0.6
              }
            },
            "push": {
              "particles_nb": 4
            },
            "remove": {
              "particles_nb": 2
            }
          }
        },
        "retina_detect": true
      });
      
      console.log("Particles.js initialized successfully");
    } catch (err) {
      console.error("Error initializing particles.js:", err);
    }
  }
}

// Function to help prevent redirect loops
/**
 * Prevents redirect loops by tracking redirect attempts
 * @returns {boolean} Whether to allow the redirect
 * @note This function is kept for future implementation or debugging
 */
// eslint-disable-next-line no-unused-vars
function preventRedirectLoop() {
  let redirectCounter = parseInt(sessionStorage.getItem('redirectCounter') || '0');
  redirectCounter++;
  sessionStorage.setItem('redirectCounter', redirectCounter.toString());
  
  console.log(`Redirect attempt ${redirectCounter} of 3 max`);
  
  if (redirectCounter > 3) {
    console.error("TOO MANY REDIRECTS - Breaking potential loop");
    sessionStorage.removeItem('redirectCounter');
    return false;
  }
  
  return true;
}

// Global functions for use in HTML
window.connectMetaMask = function(context) {
  if (window.loginManager) {
    return window.loginManager.connectWallet(context);
  } else {
    console.error("Login manager not initialized");
    return null;
  }
};

window.showRegistrationModal = function() {
  if (window.loginManager) {
    window.loginManager.showRegistrationModal();
  } else {
    const modal = document.getElementById('registrationModal');
    if (modal) modal.classList.remove('hidden');
  }
};

window.hideRegistrationModal = function() {
  if (window.loginManager) {
    window.loginManager.hideRegistrationModal();
  } else {
    const modal = document.getElementById('registrationModal');
    if (modal) modal.classList.add('hidden');
  }
};

window.togglePasswordVisibility = function(inputId, buttonId) {
  if (window.loginManager) {
    window.loginManager.togglePasswordVisibility(inputId, buttonId);
  } else {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    if (!input || !button) return;
    
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
  }
};

window.handleRegistrationSubmit = function() {
  // Get the form data
  const nationalId = document.getElementById('registerNationalId')?.value;
  const password = document.getElementById('registerPassword')?.value;
  const termsAccepted = document.getElementById('acceptTerms')?.checked;
  
  // Basic validation
  if (!nationalId || !password) {
    showFeedback(document.getElementById('registerFeedback'), 'Please fill in all required fields', true);
    return;
  }
  
  if (!termsAccepted) {
    showFeedback(document.getElementById('registerFeedback'), 'You must accept the Terms of Service', true);
    return;
  }
  
  // Get current wallet address
  const walletAddress = window.currentWalletAddress;
  if (!walletAddress) {
    showFeedback(document.getElementById('registerFeedback'), 'Please connect your MetaMask wallet first', true);
    return;
  }
  
  // Set loading state
  const button = document.getElementById('completeRegistrationBtn');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<div class="loader"></div><span>Processing...</span>';
  }
  
  // Make the API call
  fetch('http://localhost:8000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nationalId,
      password,
      walletAddress
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Registration successful
      showFeedback(document.getElementById('registerFeedback'), 'Account created successfully!', false);
      
      // Auto-fill login form
      const loginNationalId = document.getElementById('nationalId');
      if (loginNationalId) {
        loginNationalId.value = nationalId;
      }
      
      // Close modal after delay
      setTimeout(() => {
        hideRegistrationModal();
        
        // Show success on login form
        showFeedback(document.getElementById('loginFeedback'), 'Account created! You can now log in.', false);
      }, 2000);
    } else {
      // Registration failed
      showFeedback(document.getElementById('registerFeedback'), data.message || 'Registration failed', true);
    }
  })
  .catch(error => {
    console.error('Error during registration:', error);
    showFeedback(document.getElementById('registerFeedback'), 'Connection error. Please try again later.', true);
  })
  .finally(() => {
    // Reset button state
    if (button) {
      button.disabled = false;
      button.innerHTML = '<span class="icon-user-plus mr-2"></span>Create Account with ID & Wallet';
    }
  });
};

// Helper functions for password strength validation
window.updatePasswordStrength = function(password) {
  // Get UI elements
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  
  if (!strengthBar || !strengthText) return 0;
  
  // Calculate strength
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Update bar width
  strengthBar.style.width = `${score * 25}%`;
  
  // Update color and text
  if (score <= 1) {
    strengthBar.className = 'h-full bg-red-500 transition-all duration-300';
    strengthText.textContent = 'Weak';
  } else if (score === 2) {
    strengthBar.className = 'h-full bg-yellow-500 transition-all duration-300';
    strengthText.textContent = 'Fair';
  } else if (score === 3) {
    strengthBar.className = 'h-full bg-yellow-400 transition-all duration-300';
    strengthText.textContent = 'Good';
  } else {
    strengthBar.className = 'h-full bg-green-500 transition-all duration-300';
    strengthText.textContent = 'Strong';
  }
  
  // Update password requirements
  const requirements = {
    'length': password.length >= 8,
    'uppercase': /[A-Z]/.test(password),
    'number': /[0-9]/.test(password),
    'special': /[^A-Za-z0-9]/.test(password)
  };
  
  Object.entries(requirements).forEach(([req, isMet]) => {
    const reqElement = document.getElementById(`req-${req}`);
    if (!reqElement) return;
    
    const icon = reqElement.querySelector('span');
    if (icon) {
      if (isMet) {
        icon.className = 'icon-check-circle mr-1 text-green-500';
        reqElement.classList.remove('text-gray-600', 'dark:text-gray-400');
        reqElement.classList.add('text-green-600', 'dark:text-green-400');
      } else {
        icon.className = 'icon-times-circle mr-1 text-red-500';
        reqElement.classList.remove('text-green-600', 'dark:text-green-400');
        reqElement.classList.add('text-gray-600', 'dark:text-gray-400');
      }
    }
  });
  
  return score;
};

// Utility function for setting loading state
window.setLoading = function(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button._originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<div class="loader"></div><span>Processing...</span>';
  } else {
    button.disabled = false;
    button.innerHTML = button._originalText || 'Submit';
  }
};

// Wallet address formatter
window.formatWalletAddress = function(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Process login function
window.processLogin = function(nationalId, password, rememberMe) {
  if (window.loginManager) {
    // Use loginManager if available
    window.loginManager.handleLoginSubmit();
    return;
  }
  
  console.log(`Login attempt for: ${nationalId}`);
  
  // Validate inputs
  if (!nationalId || !password) {
    showFeedback(document.getElementById('loginFeedback'), 'Please fill in all fields', true);
    return;
  }
  
  if (!window.currentWalletAddress) {
    showFeedback(document.getElementById('loginFeedback'), 'Please connect your MetaMask wallet first', true);
    return;
  }
  
  // Set loading state
  const loginButton = document.getElementById('loginButton');
  setLoading(loginButton, true);
  
  // Make API request
  fetch('http://localhost:8000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nationalId,
      password,
      walletAddress: window.currentWalletAddress
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Login successful - store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('nationalId', nationalId);
      localStorage.setItem('walletAddress', window.currentWalletAddress);
      localStorage.setItem('role', data.user?.role || 'voter');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('login_timestamp', Date.now().toString());
      
      // Store remember me data if checked
      if (rememberMe) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        localStorage.setItem('rememberedNationalId', nationalId);
        localStorage.setItem('rememberedExpiry', expires.getTime().toString());
      }
      
      // Show success message
      showFeedback(document.getElementById('loginFeedback'), 'Login successful! Redirecting...', false);
      
      // Redirect based on role
      setTimeout(() => {
        const timestamp = Date.now();
        window.location.href = (data.user?.role === 'admin' ? 'admin.html' : 'index.html') + 
          '?auth=fresh&time=' + timestamp;
      }, 1500);
    } else {
      // Login failed
      showFeedback(document.getElementById('loginFeedback'), data.message || 'Invalid credentials', true);
      setLoading(loginButton, false);
    }
  })
  .catch(error => {
    console.error('Error during login:', error);
    showFeedback(document.getElementById('loginFeedback'), 'Connection error. Please try again later.', true);
    setLoading(loginButton, false);
  });
};

// Check for existing wallet connection
window.checkWalletConnection = async function() {
  if (window.ethereum) {
    try {
      // Check for connected accounts without prompting
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' // This doesn't trigger the MetaMask popup
      });
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        window.currentWalletAddress = address;
        
        // Update login form UI
        const walletAddress = document.getElementById('walletAddress');
        const walletNotConnected = document.getElementById('walletNotConnected');
        const walletConnected = document.getElementById('walletConnected');
        
        if (walletAddress) walletAddress.textContent = formatWalletAddress(address);
        if (walletNotConnected) walletNotConnected.classList.add('hidden');
        if (walletConnected) walletConnected.classList.remove('hidden');
        
        console.log('Already connected to MetaMask:', address);
        return true;
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }
  return false;
};

// Fix the syntax error around line 1610-1614
function updateParticlesColors() {
  try {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const particleColor = isDarkMode ? '#4ade80' : '#16a34a';
    console.log(`Updating particles for ${isDarkMode ? 'dark' : 'light'} mode with color: ${particleColor}`);
    
    if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
      const pJS = window.pJSDom[0].pJS;
      
      // Update particles color
      if (pJS.particles.array) {
        pJS.particles.array.forEach(p => {
          p.color.value = particleColor;
          if (typeof p.color.rgb === 'object') {
            const rgb = hexToRgb(particleColor);
            p.color.rgb = rgb;
          }
        });
      }
      
      // Update line linked color
      if (pJS.particles.line_linked) {
        pJS.particles.line_linked.color = particleColor;
        if (typeof pJS.particles.line_linked.color_rgb_line === 'object') {
          const rgb = hexToRgb(particleColor);
          pJS.particles.line_linked.color_rgb_line = rgb;
        }
      }
      
      // Force redraw
      if (pJS.fn && typeof pJS.fn.particlesRefresh === 'function') {
        pJS.fn.particlesRefresh();
      }
    }
  } catch (error) {
    console.error("Error updating particle colors:", error);
  }
}

// Add this function to fix the hideRegistrationModal undefined error
function hideRegistrationModal() {
  const modal = document.getElementById('registrationModal');
  if (modal) {
    modal.classList.add('hidden');
    // Also add fade-out animation if needed
    modal.classList.add('fade-out');
    
    // Reset form fields if needed
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Helper function for hex to RGB conversion (used by particles)
function hexToRgb(hex) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

// Improve the theme toggle function for better click handling
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (!themeToggle) return;
  
  // Set initial state based on current theme
  const isDarkMode = document.documentElement.classList.contains('dark');
  themeToggle.checked = isDarkMode;
  
  // Function to handle theme changes
  function changeTheme() {
    // Toggle dark class on html element
    document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark');
    
    // Toggle checkbox state
    themeToggle.checked = !themeToggle.checked;
    
    // Save preference to localStorage
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update particles if needed
    if (typeof updateParticlesColors === 'function') {
      updateParticlesColors();
    }
    
    // Log theme change
    console.log(`Theme changed to ${isDark ? 'dark' : 'light'} mode`);
  }
  
  // Handle checkbox change event
  themeToggle.addEventListener('change', function(event) {
    event.stopPropagation(); // Prevent event bubbling
    changeTheme();
  });
  
  // Handle click on slider
  const slider = themeToggle.nextElementSibling;
  if (slider && slider.classList.contains('slider')) {
    slider.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      changeTheme();
    });
  }
}

// Add this function to login.js
function showParticleTooltip(mode) {
  // Remove any existing tooltip
  const existingTooltip = document.getElementById('particle-mode-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  // Mode descriptions
  const modeDescriptions = {
    'push': 'Click to add particles',
    'bubble': 'Click to create bubbles',
    'repulse': 'Click to repel particles'
  };
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'particle-mode-tooltip';
  tooltip.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-50';
  tooltip.textContent = modeDescriptions[mode] || `Mode: ${mode}`;
  
  // Add to document
  document.body.appendChild(tooltip);
  
  // Remove after delay
  setTimeout(() => {
    tooltip.classList.add('fade-out');
    setTimeout(() => tooltip.remove(), 500);
  }, 2000);
}

// Add this global function for toggling particle modes
window.toggleParticleMode = function() {
  if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
    // Get the current mode
    const pJS = window.pJSDom[0].pJS;
    const currentMode = pJS.interactivity.events.onclick.mode;
    
    // Define the modes to cycle through
    const modes = ['push', 'bubble', 'repulse'];
    
    // Find current mode index
    const currentIndex = modes.indexOf(currentMode);
    
    // Get next mode (or first if at end)
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    // Update mode
    pJS.interactivity.events.onclick.mode = nextMode;
    
    // Show feedback
    showParticleModeTooltip(nextMode);
    
    console.log(`Particle mode changed to: ${nextMode}`);
    return nextMode;
  } else {
    console.error("Particles not initialized or invalid pJS object");
    return null;
  }
};

// Add a tooltip function to show feedback when mode changes
function showParticleModeTooltip(mode) {
  // Remove any existing tooltip
  const existingTooltip = document.getElementById('particle-mode-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  // Mode descriptions
  const modeDescriptions = {
    'push': 'Click to add particles',
    'bubble': 'Click to create bubbles',
    'repulse': 'Click to repel particles'
  };
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'particle-mode-tooltip';
  tooltip.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-50';
  tooltip.textContent = modeDescriptions[mode] || `Mode: ${mode}`;
  
  // Add to document
  document.body.appendChild(tooltip);
  
  // Remove after delay
  setTimeout(() => {
    tooltip.classList.add('fade-out');
    setTimeout(() => tooltip.remove(), 500);
  }, 2000);
}