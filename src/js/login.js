// Import necessary dependencies
// For development without bundler, we'll use global ethers from the HTML script tag
// const { BrowserProvider } = ethers;

// AuthService inline temporarily until we set up proper build process
class AuthService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.tokenKey = 'auth_token';
    this.refreshEndpoint = '/refresh';
    this.isAuthenticating = false;
  }

  isAuthenticated() {
    // UPDATED: Check for authentication using multiple possible keys for better compatibility
    const hasToken = !!localStorage.getItem('auth_token') || !!localStorage.getItem('token');
    const hasUserId = !!localStorage.getItem('user_id') || !!localStorage.getItem('national_id') || 
                    !!localStorage.getItem('nationalId') || !!localStorage.getItem('voterId');
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';
    
    // Return true if either the combination of token+ID exists OR the isAuthenticated flag is set
    return (hasToken && hasUserId) || isAuthFlag;
  }

  getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
  }
  
  updateCsrfToken(token) {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag && token) {
      metaTag.setAttribute('content', token);
    }
  }

  async logout() {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      });

      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      
      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  getUserInfo() {
    return {
      id: localStorage.getItem('user_id'),
      role: localStorage.getItem('user_role')
    };
  }

  saveUserInfo(data) {
    if (data.id) localStorage.setItem('user_id', data.id);
    if (data.role) localStorage.setItem('user_role', data.role);
  }
}

// Configuration Management
class ConfigService {
  static API_URL = 'http://localhost:8000'; // Set to direct connection
  static API_ENDPOINTS = {
    LOGIN: '/login',
    REGISTER: '/register',
    REFRESH: '/refresh',
    TEST: '/api-test'
  };
  
  static ENV = {
    IS_DEVELOPMENT: true, // Set to true for development mode
  };
  
  static getApiUrl() {
    return this.API_URL;
  }
  
  static setApiUrl(url) {
    this.API_URL = url;
  }
  
  static getFullEndpoint(endpoint) {
    return `${this.API_URL}${endpoint}`;
  }
}

// Wallet Management
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
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
          return await this.signer.getAddress();
        }
        return null;
      }
      
      // Request account access - this triggers the MetaMask popup
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      return await this.signer.getAddress();
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
    return await this.signer.getAddress();
  }
  
  isConnected() {
    return !!this.signer;
  }
  
  getProvider() {
    return this.provider;
  }
  
  async signMessage(message) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    return await this.signer.signMessage(message);
  }
}

// UI Utilities
class UIService {
  static showFeedback(elementId, { message, status = 'info' }) {
    const element = document.getElementById(elementId);
        if (!element) return;
        
    // Reset classes
    element.className = "alert";
    
    // Add status-specific classes
    element.classList.add(status);
    
    element.textContent = message;
    element.classList.remove('hidden');
    
    // Log message to console in development
    if (ConfigService.ENV.IS_DEVELOPMENT) {
      console.log(`[${status.toUpperCase()}] ${message}`);
    }
    
    return element;
  }
  
  static setLoading(button, isLoading) {
    if (!button) return;
    
    // Store original text if not already saved
    if (!button.dataset.originalText && !isLoading) {
      button.dataset.originalText = button.innerHTML;
    }
        
        if (isLoading) {
      button.disabled = true;
      button.innerHTML = `<span class="loading-indicator"></span><span>Processing...</span>`;
        } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || 'Submit';
    }
  }
  
  static togglePasswordVisibility(inputId, toggleBtnId) {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = document.getElementById(toggleBtnId);
    
    if (!passwordInput || !toggleBtn) return;
    
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update icon
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = type === 'password' ? 'ri-eye-line' : 'ri-eye-off-line';
    }
  }
}

// Debug Service for logging and debugging
class DebugService {
  // Log a message to console and debug panel if available
  static log(message, data = null) {
    // Always log to console
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
        } else {
      console.log(`[DEBUG] ${message}`);
    }
    
    // Log to debug panel if it exists
    const debugContent = document.getElementById('debugContent');
    if (debugContent) {
      const timestamp = new Date().toLocaleTimeString();
      let content = `<div class="text-xs text-gray-300 mb-1"><span class="text-gray-400">${timestamp}</span> ${message}</div>`;
      
      if (data) {
        if (typeof data === 'object') {
          content += `<pre class="text-xs text-green-400 mb-2 overflow-x-auto">${JSON.stringify(data, null, 2)}</pre>`;
        } else {
          content += `<pre class="text-xs text-green-400 mb-2">${data}</pre>`;
        }
      }
      
      debugContent.innerHTML = content + debugContent.innerHTML;
    }
  }
  
  // Toggle debug panel visibility
  static toggle() {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
      debugPanel.classList.toggle('hidden');
      this.log(`Debug panel ${debugPanel.classList.contains('hidden') ? 'hidden' : 'shown'}`);
    }
  }
  
  // Hide debug panel
  static hide() {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
      debugPanel.classList.add('hidden');
      console.log('[DEBUG] Panel hidden');
    }
  }
  
  // Show debug panel
  static show() {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
      debugPanel.classList.remove('hidden');
      this.log('Debug panel shown');
    }
  }
}

// Password Strength Checker
class PasswordValidator {
  static strengthLevels = ['weak', 'fair', 'good', 'strong'];
  static strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  
  static validate(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    // Calculate score (0-4)
    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      score: Math.min(score, 4),
      checks,
      isValid: score >= 3
    };
  }
  
  static updateUI(password) {
    const result = this.validate(password);
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    if (strengthBar && strengthText) {
      // Update classes based on strength
      const parent = document.getElementById('passwordStrength');
      if (parent) {
        parent.className = parent.className.replace(/strength-\w+/g, '');
        parent.classList.add(`strength-${this.strengthLevels[result.score - 1] || 'weak'}`);
      }
      
      // Set width directly
      strengthBar.style.width = `${(result.score / 4) * 100}%`;
      
      strengthText.textContent = this.strengthLevels[result.score - 1] || this.strengthLevels[0];
    }
    
    // Update requirements UI
    this.updateRequirementsUI(result.checks);
    
    return result;
  }
  
  static updateRequirementsUI(checks) {
    // Update each requirement indicator
    Object.entries(checks).forEach(([requirement, isPassed]) => {
      const element = document.getElementById(`req-${requirement}`);
      if (!element) return;
      
      const icon = element.querySelector('i');
      if (icon) {
        icon.className = isPassed ? 
          'ri-check-line mr-1 text-green-500' : 
          'ri-close-line mr-1 text-red-500';
      }
      
      // Optionally change text color
      element.classList.remove('text-gray-600', 'text-green-600');
      element.classList.add(isPassed ? 'text-green-600' : 'text-gray-600');
    });
  }
}

// API Service
class ApiService {
  constructor() {
    this.baseUrl = ConfigService.getApiUrl();
  }
  
  setBaseUrl(url) {
    this.baseUrl = url;
  }
  
  async testConnection() {
    try {
      // Try proxy connection
      const proxyUrl = '/proxy/api-test';
      try {
        DebugService.log(`Testing proxy connection with ${proxyUrl}`);
        const proxyResponse = await fetch(proxyUrl);
        if (proxyResponse.ok) {
          ConfigService.setApiUrl('/proxy');
          DebugService.log("Proxy connection successful");
          return { success: true, type: 'proxy' };
        }
      } catch (proxyError) {
        DebugService.log("Proxy connection failed", proxyError);
      }
      
      // Try direct connection
      const directUrl = 'http://localhost:8000/api-test';
      try {
        DebugService.log(`Testing direct connection with ${directUrl}`);
        const directResponse = await fetch(directUrl, { mode: 'cors' });
        if (directResponse.ok) {
          ConfigService.setApiUrl('http://localhost:8000');
          DebugService.log("Direct connection successful");
          return { success: true, type: 'direct' };
        }
      } catch (directError) {
        DebugService.log("Direct connection failed", directError);
      }
      
      return { success: false, type: null };
    } catch (error) {
      DebugService.log("Connection test error", error);
      return { success: false, type: null, error: error.message };
    }
  }
  
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important: Use cookies instead of localStorage for tokens
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
      const response = await fetch(url, options);
      
      // Get response as text first
            const responseText = await response.text();
            
      // Try to parse JSON
            let data;
            try {
        data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                data = { message: responseText || "Unknown server error" };
            }
            
            if (!response.ok) {
        throw new Error(data.message || data.detail || `Request failed with status ${response.status}`);
            }
            
            return data;
        } catch (error) {
      DebugService.log(`API request failed: ${error.message}`);
      throw error;
    }
  }
  
  // Authentication-specific methods
  async login(nationalId, password, walletAddress) {
    try {
      if (!walletAddress) {
        throw new Error("Wallet connection required for login");
      }
      
      const response = await this.request(ConfigService.API_ENDPOINTS.LOGIN, 'POST', { 
        nationalId, 
        password,
        walletAddress
      });
      
      // Ensure we have a valid response with token and user info
      if (!response.success || !response.token || !response.user) {
        throw new Error("Invalid response from server");
      }
      
      return response;
    } catch (error) {
      // Enhanced error handling
      if (error.message.includes("wallet")) {
        throw new Error("Please connect your MetaMask wallet to login");
      } else if (error.message.includes("credentials") || error.message.includes("password")) {
        throw new Error("Invalid ID or password. Please try again.");
      }
            throw error;
        }
    }
    
  async register(nationalId, password, walletAddress, role = 'voter') {
    if (!walletAddress) {
      throw new Error("Wallet connection required for registration");
    }
    
    return await this.request(ConfigService.API_ENDPOINTS.REGISTER, 'POST', { 
      voter_id: nationalId, 
      password,
      wallet_address: walletAddress,
      role
    });
  }
}

// Main Login Manager
class LoginManager {
  constructor() {
    this.apiService = new ApiService();
    this.walletService = new WalletService();
    this.authService = new AuthService(ConfigService.getApiUrl());
    this.rememberMeKey = 'remembered_voter_id';
    this.rememberMeExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    // Initialize UI state
    this.isRegistrationModalOpen = false;
    this.isWalletConnected = false;
    this.walletAddress = null;
    this.currentLoginStep = 1; // Track which step of login we're on
    
    // Create debug panel if needed
    this.createDebugPanel();
  }
  
  createDebugPanel() {
    if (!document.getElementById('debugPanel') && ConfigService.ENV.IS_DEVELOPMENT) {
      const debugPanel = document.createElement('div');
      debugPanel.id = 'debugPanel';
      debugPanel.className = 'hidden';
      debugPanel.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-semibold">Debug Log</h3>
          <button id="closeDebugPanel" class="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div id="debugContent" class="text-xs font-mono space-y-1"></div>
      `;
      document.body.appendChild(debugPanel);
      
      document.getElementById('closeDebugPanel')?.addEventListener('click', () => DebugService.hide());
    }
  }
  
  async initialize() {
    // Test API connection first
    await this.updateConnectionStatus();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Fill remembered ID if available
    this.loadRememberedId();
    
    // Initialize login steps UI
    this.updateLoginStepsUI();
    
    // Check if there's a wallet already connected through MetaMask
    this.checkExistingWalletConnection();
  }
  
  // New method to check for existing wallet connection
  async checkExistingWalletConnection() {
    if (window.ethereum && window.ethereum.selectedAddress) {
      try {
        // There's already a wallet connected, let's update our state
        // Using DebugService for logging in development mode
        DebugService.log("Found existing wallet connection");
        const address = await this.walletService.connect(true); // silent mode
        if (address) {
          this.walletAddress = address;
          this.isWalletConnected = true;
          
          // Update UI
          const walletAddress = document.getElementById('walletAddress');
          const walletNotConnected = document.getElementById('walletNotConnected');
          const walletConnected = document.getElementById('walletConnected');
          
          if (walletAddress && walletNotConnected && walletConnected) {
            walletAddress.textContent = this.formatAddress(address);
            walletNotConnected.classList.add('hidden');
            walletConnected.classList.remove('hidden');
            walletConnected.classList.add('connected');
            
            // Update login steps
            this.currentLoginStep = 2;
            this.updateLoginStepsUI();
          }
        }
      } catch (error) {
        DebugService.log("Error with existing wallet connection: " + error.message);
      }
    }
  }
  
  // New method to update the login steps UI
  updateLoginStepsUI() {
    const step1 = document.getElementById('loginStep1');
    const step2 = document.getElementById('loginStep2');
    
    if (!step1 || !step2) return;
    
    // Reset all steps
    step1.classList.remove('active', 'completed');
    step2.classList.remove('active', 'completed');
    
    // Set current step as active and previous steps as completed
    if (this.currentLoginStep === 1) {
      step1.classList.add('active');
    } else if (this.currentLoginStep === 2) {
      step1.classList.add('completed');
      step2.classList.add('active');
    } else if (this.currentLoginStep > 2) {
      step1.classList.add('completed');
      step2.classList.add('completed');
    }
    
    // Update focus on form elements based on step
    if (this.currentLoginStep === 1) {
      // Focus on connect wallet button
      const connectWalletBtn = document.getElementById('connectWalletBtn');
      if (connectWalletBtn && !this.isWalletConnected) {
        connectWalletBtn.focus();
      }
    } else if (this.currentLoginStep === 2) {
      // Focus on password field
      const passwordInput = document.getElementById('password');
      if (passwordInput) {
        passwordInput.focus();
      }
    }
    
    // Update the visibility of sections
    const credentialsSection = document.getElementById('credentialsSection');
    if (credentialsSection) {
      if (this.currentLoginStep >= 2) {
        credentialsSection.classList.remove('opacity-50');
      } else {
        credentialsSection.classList.add('opacity-50');
      }
    }
  }
  
  setupEventListeners() {
    // Login form
    document.getElementById('loginFormElement')?.addEventListener('submit', e => this.handleLoginSubmit(e));
    
    // Registration modal
    document.getElementById('showRegistrationForm')?.addEventListener('click', () => this.showRegistrationModal());
    document.getElementById('closeRegistrationModal')?.addEventListener('click', () => this.hideRegistrationModal());
    document.getElementById('registrationFormElement')?.addEventListener('submit', e => this.handleRegistrationSubmit(e));
    
    // MetaMask connection
    document.getElementById('connectWalletBtn')?.addEventListener('click', () => this.connectWallet('login'));
    document.getElementById('registerConnectWalletBtn')?.addEventListener('click', () => this.connectWallet('register'));
    
    // Password validation
    document.getElementById('registerPassword')?.addEventListener('input', e => this.handlePasswordInput(e));
    
    // Password visibility toggles
    document.getElementById('togglePassword')?.addEventListener('click', () => 
      UIService.togglePasswordVisibility('password', 'togglePassword'));
    document.getElementById('toggleRegisterPassword')?.addEventListener('click', () => 
      UIService.togglePasswordVisibility('registerPassword', 'toggleRegisterPassword'));
    
    // Listen for account changes in MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          this.handleWalletDisconnect();
            } else {
          // User switched accounts - we'll need to reconnect to get the new account
          this.connectWallet('login', true);
        }
      });
    }
    
    // Debug panel toggle
    document.addEventListener('keydown', e => {
      if (e.altKey && e.key === 'd') {
        DebugService.toggle();
      }
    });
    
    // Theme toggle handler is in the HTML file now
  }
  
  // Handle wallet disconnect
  handleWalletDisconnect() {
    this.isWalletConnected = false;
    this.walletAddress = null;
    
    // Update UI
    const walletAddress = document.getElementById('walletAddress');
    const walletNotConnected = document.getElementById('walletNotConnected');
    const walletConnected = document.getElementById('walletConnected');
    
    if (walletAddress && walletNotConnected && walletConnected) {
      walletAddress.textContent = '';
      walletNotConnected.classList.remove('hidden');
      walletConnected.classList.add('hidden');
      walletConnected.classList.remove('connected');
    }
    
    // Update login steps
    this.currentLoginStep = 1;
    this.updateLoginStepsUI();
    
    UIService.showFeedback('loginFeedback', {
      message: 'Wallet disconnected. Please reconnect to continue.',
      status: 'warning'
    });
    
    DebugService.log("Wallet disconnected");
  }
  
  // Connection Status
  async updateConnectionStatus() {
    const connectionDot = document.getElementById('connectionDot');
    const connectionText = document.getElementById('connectionText');
    
    if (!connectionDot || !connectionText) return;
    
    connectionDot.className = 'w-2 h-2 rounded-full bg-yellow-500 mr-2 pulse';
    connectionText.textContent = 'Testing connection...';
    connectionText.className = 'text-xs text-gray-600 dark:text-gray-400';
    
    try {
      const result = await this.apiService.testConnection();
      
      if (result.success) {
        connectionDot.className = 'w-2 h-2 rounded-full bg-green-500 mr-2';
        connectionText.textContent = `Connected (${result.type})`;
        connectionText.className = 'text-xs text-green-600 dark:text-green-400';
      } else {
        connectionDot.className = 'w-2 h-2 rounded-full bg-red-500 mr-2';
        connectionText.textContent = 'Connection failed';
        connectionText.className = 'text-xs text-red-600 dark:text-red-400';
      }
        } catch (error) {
      connectionDot.className = 'w-2 h-2 rounded-full bg-red-500 mr-2';
      connectionText.textContent = 'Connection error';
      connectionText.className = 'text-xs text-red-600 dark:text-red-400';
    }
  }
  
  // Wallet Connection - UPDATED
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
    
    if (!connectButton || !addressElement || !notConnectedElement || !connectedElement) return;
    
    if (!silent) {
      UIService.setLoading(connectButton, true);
    }
    
    try {
      const address = await this.walletService.connect(silent);
      this.walletAddress = address; // Store the address for login verification
      
      // Update UI
      addressElement.textContent = this.formatAddress(address);
      notConnectedElement.classList.add('hidden');
      connectedElement.classList.remove('hidden');
      connectedElement.classList.add('connected');
      
      // Update input field if in login context
      if (context === 'login') {
        const nationalIdInput = document.getElementById('nationalId');
        if (nationalIdInput && !nationalIdInput.value.trim()) {
          nationalIdInput.value = address;
        }
        
        // Update login steps
        this.currentLoginStep = 2;
        this.updateLoginStepsUI();
        
        // Update login feedback if there was an error
        const loginFeedback = document.getElementById('loginFeedback');
        if (loginFeedback && !loginFeedback.classList.contains('hidden')) {
          UIService.showFeedback('loginFeedback', {
            message: 'Wallet connected! You can now complete login.',
            status: 'success'
          });
        } else if (!silent) {
          UIService.showFeedback('loginFeedback', {
            message: 'Wallet connected! Please enter your password to complete login.',
            status: 'success'
          });
        }
      } else {
        const registerNationalIdInput = document.getElementById('registerNationalId');
        if (registerNationalIdInput && !registerNationalIdInput.value.trim()) {
          registerNationalIdInput.value = address;
        }
      }
      
      this.isWalletConnected = true;
      
      // Log wallet connection for debugging
      DebugService.log(`Wallet connected: ${address}`);
      
      return address;
        } catch (error) {
      if (!silent) {
        const feedbackId = context === 'login' ? 'loginFeedback' : 'registerFeedback';
        UIService.showFeedback(feedbackId, {
          message: `Failed to connect wallet: ${error.message}`,
          status: 'error'
        });
      }
      
      this.isWalletConnected = false;
      this.walletAddress = null;
      
      DebugService.log(`Wallet connection failed: ${error.message}`);
        } finally {
      if (!silent) {
        UIService.setLoading(connectButton, false);
      }
    }
  }
  
  // Login Form Handling
  async handleLoginSubmit(event) {
    event.preventDefault();
    
    const nationalIdInput = document.getElementById('nationalId');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginButton = document.getElementById('loginButton');
    
    if (!nationalIdInput || !passwordInput || !loginButton) return;
    
    const nationalId = nationalIdInput.value.trim();
        const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox?.checked || false;
    
    // Basic validation
    if (!nationalId || !password) {
      UIService.showFeedback('loginFeedback', { 
        message: 'Please fill in all fields', 
        status: 'error'
      });
            return;
        }
        
    // Check wallet connection - NEW MANDATORY CHECK
    if (!this.isWalletConnected || !this.walletAddress) {
      UIService.showFeedback('loginFeedback', { 
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
    
    // Show loading state
    UIService.setLoading(loginButton, true);
    
    try {
      // Include wallet address in login request
      const loginResult = await this.apiService.login(nationalId, password, this.walletAddress);
      
      // Use our new function to ensure a consistent authentication state
      this.ensureConsistentAuthState(loginResult);
      
      // Remember national ID if requested (but not the password!)
      if (rememberMe) {
        this.saveRememberedId(nationalId);
      } else {
        this.clearRememberedId();
      }
      
      // Display success message
      UIService.showFeedback('successMessage', {
        message: 'Login successful! Redirecting...',
        status: 'success'
      });
      
      // Reset any redirect counters to prevent false detection of redirect loops
      sessionStorage.removeItem('redirectCounter');
      
      // Redirect based on role with a special parameter to indicate fresh login
            setTimeout(() => {
        // Check if we should allow the redirect (prevents redirect loops)
        if (!this.preventRedirectLoop()) {
          console.error("Redirect blocked to prevent loop - user can manually navigate");
          // Show an alert to the user
          UIService.showFeedback('loginFeedback', {
            message: 'Redirect prevented to avoid a loop. You can manually navigate to the home page.',
            status: 'warning'
          });
          UIService.setLoading(loginButton, false);
          return;
        }
        
        // Determine destination based on user role
        const redirectDestination = loginResult.user.role === 'admin' ? 'admin.html' : 'index.html';
        
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        
        // Log the redirection for debugging
        console.log(`Redirecting to: ${redirectDestination}?auth=${timestamp}`);
        
        // Execute the redirect - SIMPLIFIED DIRECT APPROACH
        window.location.href = `${redirectDestination}?auth=fresh&time=${timestamp}`;
            }, 1500);
        } catch (error) {
      UIService.showFeedback('loginFeedback', {
        message: error.message || 'Login failed. Please try again.',
        status: 'error'
      });
      UIService.setLoading(loginButton, false);
    }
  }
  
  // New helper function to ensure consistent authentication state
  ensureConsistentAuthState(loginResult) {
    // Clear any existing auth data first
    localStorage.removeItem('redirectCounter');
    sessionStorage.removeItem('redirectCounter');
    
    // Set all authentication indicators consistently
    localStorage.setItem('auth_token', loginResult.token);
    localStorage.setItem('token', loginResult.token); // Add duplicate for compatibility
    localStorage.setItem('user_id', loginResult.user.id);
    localStorage.setItem('user_role', loginResult.user.role);
    localStorage.setItem('role', loginResult.user.role); // Add duplicate for compatibility
    localStorage.setItem('national_id', loginResult.user.nationalId);
    localStorage.setItem('nationalId', loginResult.user.nationalId); // Add duplicate for compatibility
    localStorage.setItem('voterId', loginResult.user.nationalId); // Add duplicate for compatibility
    localStorage.setItem('wallet_address', loginResult.user.walletAddress);
    localStorage.setItem('walletAddress', loginResult.user.walletAddress); // Add duplicate for compatibility
    localStorage.setItem('isAuthenticated', 'true');
    
    // Add login timestamp for additional verification - use a precise timestamp
    const loginTime = Date.now();
    localStorage.setItem('login_timestamp', loginTime.toString());
    
    // Set session flags for authentication tracking
    sessionStorage.setItem('JUST_LOGGED_IN', 'true');
    sessionStorage.setItem('LOGIN_TIME', loginTime.toString());
    
    // Create a special authentication bridge cookie that's easier for app.js to detect
    // This will bypass any potential race conditions in localStorage
    document.cookie = `auth_verified=true; path=/; max-age=3600`;
    document.cookie = `auth_time=${loginTime}; path=/; max-age=3600`;
    document.cookie = `auth_user_id=${loginResult.user.id}; path=/; max-age=3600`;
    document.cookie = `auth_role=${loginResult.user.role}; path=/; max-age=3600`;
    
    // Use the authService to save user info
    this.authService.saveUserInfo(loginResult.user);
    
    // Log the authentication state for debugging
    console.log("Authentication state set with:", {
      token: loginResult.token ? "exists" : "missing",
      id: loginResult.user.id,
      role: loginResult.user.role,
      loginTime
    });
  }
  
  // Registration Form Handling
  showRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
      modal.classList.remove('hidden');
      this.isRegistrationModalOpen = true;
    }
  }
  
  hideRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
      modal.classList.add('hidden');
      this.isRegistrationModalOpen = false;
    }
  }
  
  handlePasswordInput(event) {
    const password = event.target.value;
    PasswordValidator.updateUI(password);
  }
  
  async handleRegistrationSubmit(event) {
    event.preventDefault();
    
    const nationalIdInput = document.getElementById('registerNationalId');
    const passwordInput = document.getElementById('registerPassword');
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    const registerButton = document.getElementById('completeRegistrationBtn');
    
    if (!nationalIdInput || !passwordInput || !registerButton) return;
    
    const nationalId = nationalIdInput.value.trim();
    const password = passwordInput.value.trim();
    const acceptedTerms = acceptTermsCheckbox?.checked || false;
    
    // Basic validation
    if (!nationalId || !password) {
      UIService.showFeedback('registerFeedback', { 
        message: 'Please fill in all fields', 
        status: 'error'
      });
            return;
        }
        
    if (!acceptedTerms) {
      UIService.showFeedback('registerFeedback', { 
        message: 'You must accept the terms of service', 
        status: 'error'
      });
            return;
        }
        
    // Password strength validation
    const passwordValidation = PasswordValidator.validate(password);
    if (!passwordValidation.isValid) {
      UIService.showFeedback('registerFeedback', { 
        message: 'Please use a stronger password', 
        status: 'error'
      });
            return;
        }
        
    // Check wallet is connected
    if (!this.isWalletConnected || !this.walletAddress) {
      UIService.showFeedback('registerFeedback', { 
        message: 'Please connect your MetaMask wallet', 
        status: 'error'
      });
      
      // Highlight the connect wallet button
      const registerConnectWalletBtn = document.getElementById('registerConnectWalletBtn');
      if (registerConnectWalletBtn) {
        registerConnectWalletBtn.classList.add('animate-pulse');
        setTimeout(() => {
          registerConnectWalletBtn.classList.remove('animate-pulse');
        }, 2000);
      }
            return;
        }
        
    // Show loading state
    UIService.setLoading(registerButton, true);
    
    try {
      // Include wallet address in registration
      await this.apiService.register(nationalId, password, this.walletAddress);
      
      UIService.showFeedback('registerFeedback', {
        message: 'Registration successful! You can now login.',
        status: 'success'
      });
      
      // Close registration modal after a delay
      setTimeout(() => {
        this.hideRegistrationModal();
        
        // Fill the login form with the registered ID
        const loginIdInput = document.getElementById('nationalId');
        if (loginIdInput) loginIdInput.value = nationalId;
        
        // Focus on password field
        const loginPasswordInput = document.getElementById('password');
        if (loginPasswordInput) loginPasswordInput.focus();
        
        // Ensure wallet stays connected for login
        UIService.showFeedback('loginFeedback', {
          message: 'Account created! Enter your password to log in.',
          status: 'success'
        });
      }, 2000);
        } catch (error) {
      UIService.showFeedback('registerFeedback', {
        message: error.message || 'Registration failed. Please try again.',
        status: 'error'
      });
      
      DebugService.log(`Registration failed: ${error.message}`);
    } finally {
      UIService.setLoading(registerButton, false);
    }
  }
  
  // Remember Me Functionality
  saveRememberedId(nationalId) {
    if (!nationalId) return;
    
    const expiryDate = new Date().getTime() + this.rememberMeExpiry;
    localStorage.setItem(this.rememberMeKey, JSON.stringify({
      id: nationalId,
      expires: expiryDate
    }));
  }
  
  loadRememberedId() {
    const savedData = localStorage.getItem(this.rememberMeKey);
    if (!savedData) return;
    
    try {
      const { id, expires } = JSON.parse(savedData);
      
      // Check if expired
      if (new Date().getTime() > expires) {
        this.clearRememberedId();
        return;
      }
      
      // Fill the login form
      const nationalIdInput = document.getElementById('nationalId');
      if (nationalIdInput) nationalIdInput.value = id;
      
      // Check the remember me box
      const rememberMeCheckbox = document.getElementById('rememberMe');
      if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        } catch (error) {
      this.clearRememberedId();
    }
  }
  
  clearRememberedId() {
    localStorage.removeItem(this.rememberMeKey);
  }
  
  // Helpers
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Set theme based on preference
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Setup theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      // Update button icon on initialization
      updateThemeToggleIcon(themeToggle);
      
      themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        // Add click animation immediately
        themeToggle.classList.add('clicking');
        setTimeout(() => {
          themeToggle.classList.remove('clicking');
        }, 300);
        
        if (isDark) {
          html.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          html.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
        
        // Update the theme toggle button appearance
        updateThemeToggleIcon(themeToggle);
        
        // Update particles if initialized
        if (typeof updateParticlesTheme === 'function') {
          setTimeout(updateParticlesTheme, 100);
        }
        
        // Also apply our custom green particles
        if (typeof updateParticlesThemeCustom === 'function') {
          setTimeout(updateParticlesThemeCustom, 200);
        }
      });
    }
  };
  
  // Helper function to update theme toggle icon
  const updateThemeToggleIcon = (toggleButton) => {
    if (!toggleButton) return;
    
    const sunIcon = toggleButton.querySelector('.icon-sun');
    const moonIcon = toggleButton.querySelector('.icon-moon');
    
    if (sunIcon && moonIcon) {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Clear existing classes first for better consistency
      sunIcon.classList.remove('hidden');
      moonIcon.classList.remove('hidden');
      
      if (isDark) {
        // Dark mode - show moon, hide sun
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      } else {
        // Light mode - show sun, hide moon
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      }
      
      console.log(`Theme toggled to ${isDark ? 'dark' : 'light'} mode, sunIcon hidden: ${sunIcon.classList.contains('hidden')}, moonIcon hidden: ${moonIcon.classList.contains('hidden')}`);
    }
  };
  
  // Check URL parameters for debug info
  const checkForDebugInfo = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('redirect_reason') && urlParams.get('redirect_reason') === 'not_authenticated') {
      // Create or get debug info container
      let debugInfo = document.getElementById('authDebugInfo');
      if (!debugInfo) {
        debugInfo = document.createElement('div');
        debugInfo.id = 'authDebugInfo';
        debugInfo.className = 'mt-4 p-2 bg-gray-100 dark:bg-gray-800 text-xs font-mono rounded hidden';
        
        // Add a toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Debug Info';
        toggleButton.className = 'text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2';
        toggleButton.onclick = function() {
          const content = document.getElementById('authDebugContent');
          if (content) {
            const isHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden', !isHidden);
            this.textContent = isHidden ? 'Hide Debug Info' : 'Show Debug Info';
          }
        };
        
        const content = document.createElement('div');
        content.id = 'authDebugContent';
        content.className = 'hidden';
        
        debugInfo.appendChild(toggleButton);
        debugInfo.appendChild(content);
        
        // Add to page
        const form = document.getElementById('loginFormElement');
        if (form && form.parentNode) {
          form.parentNode.insertBefore(debugInfo, form.nextSibling);
        }
      }
      
      // Update debug content
      const content = document.getElementById('authDebugContent');
      if (content) {
        const debugHtml = `
          <p class="text-red-500 dark:text-red-400 font-bold">Authentication Failed</p>
          <ul class="mt-1 space-y-1">
            <li>Has Token: ${urlParams.get('has_token') || 'N/A'}</li>
            <li>Has Role: ${urlParams.get('has_role') || 'N/A'}</li>
            <li>Has ID: ${urlParams.get('has_id') || 'N/A'}</li>
            <li>Auth Flag: ${urlParams.get('has_auth_flag') || 'N/A'}</li>
            <li>Fresh Login: ${urlParams.get('fresh_login') || 'N/A'}</li>
            <li>Recent Login: ${urlParams.get('recent_login') || 'N/A'}</li>
            <li>Redirect Count: ${urlParams.get('redirect_count') || 'N/A'}</li>
            <li>Login Time: ${urlParams.get('login_time') || 'N/A'}</li>
            <li>Cookie Auth: ${urlParams.get('cookie_auth') || 'N/A'}</li>
            <li>Cookie Time: ${urlParams.get('cookie_time') || 'N/A'}</li>
            <li>Cookie ID: ${urlParams.get('cookie_id') || 'N/A'}</li>
            <li>Current Time: ${new Date().toISOString()}</li>
            <li>Time Diff: ${urlParams.get('login_time') && localStorage.getItem('login_timestamp') ? 
                 `${Math.round((Date.now() - parseInt(localStorage.getItem('login_timestamp')))/1000)} seconds` : 'N/A'}</li>
            <li>Redirect Time: ${new Date(parseInt(urlParams.get('time') || '0')).toLocaleString()}</li>
          </ul>
          <div class="mt-2">
            <p class="font-bold">Cookies & LocalStorage:</p>
            <ul class="mt-1 space-y-1">
              <li>auth_verified cookie: ${document.cookie.includes('auth_verified=true') ? '✓' : '✗'}</li>
              <li>auth_user_id cookie: ${(function() {
                  const match = document.cookie.match(/auth_user_id=([^;]+)/);
                  return match ? '✓ (' + match[1] + ')' : '✗';
                })()}</li>
              <li>auth_time cookie: ${(function() {
                  const match = document.cookie.match(/auth_time=([^;]+)/);
                  return match ? '✓ (' + new Date(parseInt(match[1])).toLocaleString() + ')' : '✗';
                })()}</li>
              <li>auth_token: ${localStorage.getItem('auth_token') ? '✓' : '✗'}</li>
              <li>token: ${localStorage.getItem('token') ? '✓' : '✗'}</li>
              <li>user_id: ${localStorage.getItem('user_id') ? '✓' : '✗'}</li>
              <li>user_role: ${localStorage.getItem('user_role') ? '✓' : '✗'}</li>
              <li>national_id: ${localStorage.getItem('national_id') ? '✓' : '✗'}</li>
              <li>voterId: ${localStorage.getItem('voterId') ? '✓' : '✗'}</li>
              <li>isAuthenticated: ${localStorage.getItem('isAuthenticated') ? '✓' : '✗'}</li>
              <li>login_timestamp: ${localStorage.getItem('login_timestamp') ? 
                  new Date(parseInt(localStorage.getItem('login_timestamp'))).toLocaleString() : 'None'}</li>
            </ul>
          </div>
          <div class="mt-4">
            <button id="fixAuthButton" class="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
              Fix Authentication
            </button>
          </div>
        `;
        
        content.innerHTML = debugHtml;
        debugInfo.classList.remove('hidden');
        
        // Add event handler for the fix auth button
        setTimeout(() => {
          const fixAuthButton = document.getElementById('fixAuthButton');
          if (fixAuthButton) {
            fixAuthButton.addEventListener('click', function() {
              // Set a fresh timestamp
              const now = Date.now();
              localStorage.setItem('login_timestamp', now.toString());
              
              // Ensure all authentication flags are set
              localStorage.setItem('isAuthenticated', 'true');
              
              // If we have an ID in the URL but not in localStorage, copy it
              const urlId = urlParams.get('id');
              if (urlId && !localStorage.getItem('user_id')) {
                localStorage.setItem('user_id', urlId);
              }
              
              // Set auth cookies as well for more reliability
              document.cookie = `auth_verified=true; path=/; max-age=3600`;
              document.cookie = `auth_time=${now}; path=/; max-age=3600`;
              document.cookie = `auth_user_id=${localStorage.getItem('user_id') || urlId || 'fix'}; path=/; max-age=3600`;
              document.cookie = `auth_role=${localStorage.getItem('user_role') || localStorage.getItem('role') || 'voter'}; path=/; max-age=3600`;
              
              // Set a message and reload in 2 seconds
              const buttonText = fixAuthButton.textContent;
              fixAuthButton.textContent = 'Fixing authentication...';
              fixAuthButton.disabled = true;
              
              setTimeout(() => {
                window.location.href = 'index.html?auth=fresh&from=fix&time=' + Date.now();
              }, 1500);
            });
          }
        }, 100);
      }
    }
  };
  
  // Initialize theme
  initializeTheme();
  
  // Ensure theme toggle icon is updated after DOM is fully loaded
  setTimeout(() => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) updateThemeToggleIcon(themeToggle);
  }, 100);
  
  // Check for debug info
  checkForDebugInfo();
  
  // Function to update particles theme
  let updateParticlesTheme;
  
  // Initialize the login manager
  const loginManager = new LoginManager();
  window.loginManager = loginManager; // Make loginManager globally accessible
  await loginManager.initialize();
  
  // Initialize particles.js if element exists
  const particlesContainer = document.getElementById('particles-js');
  if (particlesContainer && typeof window.particlesJS === 'function') {
    // Get theme
    const isDarkMode = document.documentElement.classList.contains('dark');
    
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
          "value": "#16a34a"
        },
        "shape": {
          "type": "circle",
          "stroke": {
            "width": 0,
            "color": "#000000"
          },
          "polygon": {
            "nb_sides": 5
          },
        },
        "opacity": {
          "value": 0.3,
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
          "color": "#16a34a",
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
          "bubble": {
            "distance": 400,
            "size": 40,
            "duration": 2,
            "opacity": 8,
            "speed": 3
          },
          "repulse": {
            "distance": 200,
            "duration": 0.4
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
    
    // Apply green color theme immediately
    setTimeout(() => {
      if (typeof updateParticlesThemeCustom === 'function') {
        updateParticlesThemeCustom();
        console.log("Initial green color theme applied to particles");
      }
    }, 300);
    
    // Update particles color on theme change
    updateParticlesTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
        const particles = window.pJSDom[0].pJS.particles;
        // Use green color for both themes
        const greenColor = "#16a34a"; // Tailwind green-600
        particles.color.value = greenColor;
        particles.line_linked.color = greenColor;
        
        // Refresh particles to apply changes
        if (window.pJSDom[0].pJS.fn && typeof window.pJSDom[0].pJS.fn.particlesRefresh === 'function') {
          window.pJSDom[0].pJS.fn.particlesRefresh();
        } else {
          console.log("particlesRefresh function not available");
        }
      } else {
        console.log("Particles not ready for theme update");
      }
    };
  }
});

// Add redirect loop prevention function
function preventRedirectLoop() {
  // Get or initialize redirect counter
  let redirectCounter = parseInt(sessionStorage.getItem('redirectCounter') || '0');
  redirectCounter++;
  // Store updated count
  sessionStorage.setItem('redirectCounter', redirectCounter.toString());
  
  console.log(`Redirect attempt ${redirectCounter} of 3 max`);
  
  // Block if we've exceeded the limit (3 redirects)
  if (redirectCounter > 3) {
    console.error("TOO MANY REDIRECTS - Breaking potential loop");
    sessionStorage.removeItem('redirectCounter'); // Reset counter
    return false; // Don't allow redirect
  }
  
  return true; // Allow redirect
}

// Initialize additional handlers when document loads
document.addEventListener('DOMContentLoaded', function() {
  console.log("Login page loaded, resetting redirect counter");
  
  // Reset redirect counter when explicitly navigating to login page
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout') || urlParams.has('signin')) {
    sessionStorage.removeItem('redirectCounter');
  }
  
  // If page loaded successfully, reset counter after short delay
  setTimeout(() => {
    sessionStorage.removeItem('redirectCounter');
    console.log("Redirect counter reset on login page load");
  }, 2000);
});

// Global variables for registration modal
let loginManagerInstance = null;

// Set up global reference to loginManager on initialization
document.addEventListener('DOMContentLoaded', function() {
  // Wait for loginManager to be initialized before storing reference
  setTimeout(() => {
    // Find loginManager instance from DOMContentLoaded events
    if (window.loginManager) {
      loginManagerInstance = window.loginManager;
      console.log("Login manager instance captured for global access");
    }
  }, 500);
});

// Global functions for registration modal
function showRegistrationModal() {
  console.log("Registration modal opened", loginManagerInstance);
  if (loginManagerInstance) {
    loginManagerInstance.showRegistrationModal();
  } else {
    // Fallback implementation if loginManager instance isn't available
    const modal = document.getElementById('registrationModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }
}

function hideRegistrationModal() {
  console.log("Registration modal closed", loginManagerInstance);
  if (loginManagerInstance) {
    loginManagerInstance.hideRegistrationModal();
  } else {
    // Fallback implementation if loginManager instance isn't available
    const modal = document.getElementById('registrationModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
}

// Update particles theme with green color
function updateParticlesThemeCustom() {
  console.log("Updating particles theme with custom green color");
  if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
    const particles = window.pJSDom[0].pJS.particles;
    // Set custom green color
    const greenColor = "#16a34a"; // Tailwind green-600
    particles.color.value = greenColor;
    particles.line_linked.color = greenColor;
    
    // Refresh particles to apply changes
    if (window.pJSDom[0].pJS.fn && typeof window.pJSDom[0].pJS.fn.particlesRefresh === 'function') {
      window.pJSDom[0].pJS.fn.particlesRefresh();
    } else {
      console.log("particlesRefresh function not available");
    }
  } else {
    console.log("Particles not ready for color update");
  }
}

// Function to toggle password visibility
function togglePasswordVisibility(inputId, toggleBtnId) {
  console.log("Password visibility toggled", loginManagerInstance);
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = document.getElementById(toggleBtnId);
  
  if (!passwordInput || !toggleBtn) return;
  
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  
  // Update icon
  const icon = toggleBtn.querySelector('i');
  if (icon) {
    icon.className = type === 'password' ? 'ri-eye-line' : 'ri-eye-off-line';
  }
}

// Global functions for password visibility toggling
function toggleLoginPassword() {
  console.log("Password visibility toggled for login");
  togglePasswordVisibility('password', 'togglePassword');
}

function toggleRegisterPassword() {
  console.log("Password visibility toggled for registration");
  togglePasswordVisibility('registerPassword', 'toggleRegisterPassword');
}
