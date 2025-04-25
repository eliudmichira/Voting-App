const express = require('express');
const path = require('path');
const cors = require('cors');
// const helmet = require('helmet'); // Commenting out unused import
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');

// Load configuration
const config = require('./config');

/**
 * IMPORTANT: To start this server in PowerShell:
 * 1. Use: cd .. ; node server.js    (note the semicolon instead of &&)
 * 2. Or better, run directly: node server.js
 * 
 * PowerShell doesn't support the && operator - use ; instead
 */

const app = express();
const PORT = config.server.port;
const HOST = config.server.host;

// Enhanced CORS config
app.use(cors(config.server.cors));

// Updated CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:8000 wss://localhost:8000; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://*; frame-src 'self'"
  );
  next();
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve specific paths for easier file organization
app.use('/js', express.static(path.join(__dirname, 'src/js')));
app.use('/css', express.static(path.join(__dirname, 'src/css')));
app.use('/html', express.static(path.join(__dirname, 'src/html')));

// Serve the src directory directly
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve the build directory to access contract ABI and addresses
app.use('/build', express.static(path.join(__dirname, 'build')));

// Serve the migration log file for deployment statistics
app.use('/latest-migration.log', (req, res) => {
  const logPath = path.join(__dirname, 'latest-migration.log');
  if (fs.existsSync(logPath)) {
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(logPath);
  } else {
    res.status(404).send('Migration log not found');
  }
});

// Make sure HTML files are properly served with the right content type
app.use('/src/html', express.static(path.join(__dirname, 'src/html'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Mock API endpoints for development
app.get('/api/data/constituencies', (req, res) => {
  const constituencies = [
    { id: 'westlands', name: 'Westlands' },
    { id: 'dagoretti_north', name: 'Dagoretti North' },
    { id: 'dagoretti_south', name: 'Dagoretti South' },
    { id: 'langata', name: 'Langata' },
    { id: 'kibra', name: 'Kibra' },
    { id: 'roysambu', name: 'Roysambu' },
    { id: 'kasarani', name: 'Kasarani' },
    { id: 'ruaraka', name: 'Ruaraka' },
    { id: 'embakasi_south', name: 'Embakasi South' },
    { id: 'embakasi_north', name: 'Embakasi North' },
    { id: 'embakasi_central', name: 'Embakasi Central' },
    { id: 'embakasi_east', name: 'Embakasi East' },
    { id: 'embakasi_west', name: 'Embakasi West' },
    { id: 'makadara', name: 'Makadara' },
    { id: 'kamukunji', name: 'Kamukunji' },
    { id: 'starehe', name: 'Starehe' },
    { id: 'mathare', name: 'Mathare' }
  ];
  res.json(constituencies);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Web server running. Database API should be running at http://localhost:8000',
    environment: config.app.name,
    version: config.app.version
  });
});

// Proxy for Database API status
app.get('/api/db-status', async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    res.json({
      web_server: { status: 'ok', timestamp: new Date().toISOString() },
      database_api: data
    });
  } catch (error) {
    res.json({
      web_server: { status: 'ok', timestamp: new Date().toISOString() },
      database_api: { status: 'error', message: 'Cannot connect to Database API' }
    });
  }
});

// Add proxy endpoint for API testing
app.get('/proxy/api-test', async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/api-test');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(200).json({ 
      status: 'error', 
      message: 'Cannot connect to Database API',
      timestamp: new Date().toISOString()
    });
  }
});

// Add proxy endpoint for voting dates
app.get('/proxy/voting/dates', (req, res) => {
  // Current timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Mock voting dates (one hour ago to one hour from now)
  res.json({
    start_date: now - 3600,
    end_date: now + 3600
  });
});

// Handle requests for non-existent login-new.js
app.get('/js/login-new.js', (req, res) => {
  console.log('Request for login-new.js redirected to login.js');
  res.redirect('/js/login.js');
});

// Fallback route for HTML files in development
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, 'src', 'html', `${page}.html`));
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

// Special route for handling authentication bypass (will create a cookie)
app.get('/auth-bypass', (req, res) => {
  const { id, role } = req.query;
  
  debugLog(`Auth-bypass endpoint called for user: ${id} (${role})`, {
    requestUrl: req.originalUrl,
    queryParams: req.query,
    referrer: req.headers.referer || 'none',
    userAgent: req.headers['user-agent']
  });
  
  // Set cookie with authentication data
  res.cookie('auth_verified', 'true', { maxAge: 3600000, httpOnly: false });
  res.cookie('auth_user_id', id, { maxAge: 3600000, httpOnly: false });
  res.cookie('auth_role', role, { maxAge: 3600000, httpOnly: false });
  res.cookie('auth_time', Date.now(), { maxAge: 3600000, httpOnly: false });
  
  // Log cookies being set
  debugLog(`Setting authentication cookies for user: ${id}`, {
    cookies: {
      auth_verified: 'true',
      auth_user_id: id,
      auth_role: role,
      auth_time: new Date().toISOString()
    }
  });
  
  // Determine destination based on role
  const destination = role === 'admin' ? 'admin.html' : 'index.html';
  
  // Log redirect destination
  debugLog(`Redirecting user to: /${destination} with auth=fresh parameter`);
  
  // Redirect to the correct page with auth=fresh parameter
  res.redirect(`/${destination}?auth=fresh&id=${id}&role=${role}`);
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

// Add missing API endpoints that the login page is trying to access
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle both correct and incorrect paths for voting dates
app.get(['/voting/dates', '/http://localhost:8000/voting/dates'], (req, res) => {
  // Current timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Voting period: Yesterday to 5 days from now
  res.json({
    start_date: now - 86400,
    end_date: now + 86400 * 5
  });
});

app.get('/candidates', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', party: 'Party A', constituency: 'westlands', votes: 245 },
    { id: 2, name: 'Jane Smith', party: 'Party B', constituency: 'westlands', votes: 189 },
    { id: 3, name: 'Bob Johnson', party: 'Party C', constituency: 'kibra', votes: 302 },
    { id: 4, name: 'Alice Brown', party: 'Party D', constituency: 'kibra', votes: 276 }
  ]);
});

// Debug logger function
function debugLog(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Add these helper functions at the top of the file, after the imports
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Update your login endpoint to work with both paths
// This handles both /api/login and mistaken /api/api/login paths
app.post(['/api/login', '/api/api/login'], (req, res) => {
  const { nationalId, password } = req.body;
  
  console.log('Received login request:', {
    path: req.path, // Log which path was used
    nationalId,
    password: '********',
    walletAddress: req.body.walletAddress || 'Not provided'
  });
  
  // If this was the wrong path, log a warning
  if (req.path === '/api/api/login') {
    console.warn('Warning: Client used incorrect path with duplicate /api');
  }
  
  // Rest of your login handler...
  if (nationalId === '12345678' && password === 'testpassword') {
    res.json({
      success: true,
      token: 'mock-jwt-token-for-testing',
      user: {
        id: nationalId,
        name: 'Test User',
        role: 'voter',
        nationalId: nationalId
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock registration endpoint
app.post('/api/register', async (req, res) => {
  const { nationalId, password, walletAddress } = req.body;
  
  debugLog(`Registration attempt for National ID: ${nationalId} with wallet address: ${walletAddress || 'not provided'}`);
  
  // Simple validation
  if (!nationalId || !password) {
    debugLog('Registration failed: Missing required fields');
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  try {
    // Read existing users
    const usersData = fs.readFileSync(path.join(__dirname, 'Database_API', 'users.json'), 'utf8');
    const usersObj = JSON.parse(usersData);
    const users = usersObj.users || [];
    
    // Check if user already exists
    if (users.some(user => user.nationalId === nationalId)) {
      debugLog(`Registration failed: User with National ID ${nationalId} already exists`);
      return res.status(400).json({
        success: false,
        message: 'User with this National ID already exists'
      });
    }
    
    // Generate random salt and hash the password
    const salt = crypto.randomBytes(16).toString('hex');
    // Hash the password with the salt
    const hashedPassword = hashPassword(password, salt);
    
    // Create new user
    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      nationalId,
      passwordHash: hashedPassword,
      passwordSalt: salt,
      walletAddress: walletAddress || null,
      created: new Date().toISOString(),
      lastLogin: null,
      role: 'voter' // Default role
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save back to file
    fs.writeFileSync(
      path.join(__dirname, 'Database_API', 'users.json'),
      JSON.stringify({ users }, null, 2)
    );
    
    debugLog(`Registration successful for new user: ${newUser.id} (${newUser.role}) with wallet address: ${walletAddress || 'not provided'}`);
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        nationalId: newUser.nationalId,
        role: newUser.role,
        walletAddress: walletAddress || null
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    debugLog(`Registration error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/html/admin.html'));
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`App: ${config.app.name} v${config.app.version}`);
}); 