// Create a helper file for API connections
(function() {
  // Make sure ConfigService is available
  if (!window.ConfigService) {
    console.error('ConfigService is not initialized!');
    window.ConfigService = {
      getApiUrl: function() {
        return 'http://localhost:8000'; // Fallback
      }
    };
  }
  
  // Create API helper
  window.ApiHelper = {
    getUrl: function(endpoint) {
      const baseUrl = window.ConfigService.getApiUrl();
      
      // Check if endpoint already contains the base URL
      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        console.warn('Endpoint already contains full URL:', endpoint);
        return endpoint;
      }
      
      // Handle endpoint format with proper URL building
      if (endpoint.startsWith('/')) {
        // Remove any trailing slash from baseUrl to avoid double slashes
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return cleanBaseUrl + endpoint;
      } else {
        // Add slash between baseUrl and endpoint
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        return cleanBaseUrl + endpoint;
      }
    },
    
    async request(endpoint, method = 'GET', body = null) {
      const url = this.getUrl(endpoint);
      try {
        const options = {
          method,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        };
        
        if (body && method !== 'GET') {
          options.body = JSON.stringify(body);
        }
        
        console.log(`Making ${method} request to: ${url}`);
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Error in API request to ${url}:`, error);
        throw error;
      }
    },
    
    // Helper methods for common operations
    async get(endpoint) {
      return this.request(endpoint, 'GET');
    },
    
    async post(endpoint, data) {
      return this.request(endpoint, 'POST', data);
    }
  };
})(); 