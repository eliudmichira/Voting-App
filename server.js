const express = require('express');
const path = require('path');
const cors = require('cors');
// const helmet = require('helmet'); // Commenting out unused import
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');

/**
 * IMPORTANT: To start this server in PowerShell:
 * 1. Use: cd .. ; node server.js    (note the semicolon instead of &&)
 * 2. Or better, run directly: node server.js
 * 
 * PowerShell doesn't support the && operator - use ; instead
 */

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced CORS config
app.use(cors({
  origin: 'http://localhost:8080',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

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

// Serve static files with updated paths
app.use('/js', express.static(path.join(__dirname, 'src/js')));
app.use('/js/pages', express.static(path.join(__dirname, 'src/js/pages')));
app.use('/js/components', express.static(path.join(__dirname, 'src/js/components')));
app.use('/css', express.static(path.join(__dirname, 'src/css')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));
app.use('/dist', express.static(path.join(__dirname, 'src/dist')));
app.use('/build/contracts', express.static(path.join(__dirname, 'build/contracts')));
app.use(express.static(path.join(__dirname, 'public')));

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
    message: 'Web server running. Database API should be running at http://localhost:8000'
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

// Serve static files from the src/html directory for development
app.use(express.static(path.join(__dirname, 'src', 'html')));

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
  res.sendFile(path.join(__dirname, 'src', 'html', 'index.html'));
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

app.get('/voting/dates', (req, res) => {
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

// Mock login endpoint
app.post('/api/login', async (req, res) => {
  const { nationalId, password, walletAddress } = req.body;
  
  debugLog(`Login attempt for National ID: ${nationalId} with wallet address: ${walletAddress || 'not provided'}`);
  
  if (!nationalId || !password) {
    debugLog('Login failed: Missing required fields');
    return res.status(400).json({
      success: false,
      message: 'National ID and password are required'
    });
  }
  
  try {
    // Read users from users.json
    const usersData = fs.readFileSync(path.join(__dirname, 'Database_API', 'users.json'), 'utf8');
    const users = JSON.parse(usersData).users || [];
    
    // Find user by nationalId
    const user = users.find(u => u.nationalId === nationalId);
    
    if (!user) {
      debugLog(`Login failed: User with National ID ${nationalId} not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const { passwordHash, passwordSalt } = user;
    
    // Log password verification details (for debugging only - remove in production)
    debugLog(`Password verification details:`, { 
      providedPassword: password,
      storedHash: passwordHash ? passwordHash.substring(0, 10) + '...' : 'none',
      storedSalt: passwordSalt ? passwordSalt.substring(0, 10) + '...' : 'none'
    });
    
    // Proper password verification using crypto
    let isPasswordValid = false;
    
    if (passwordHash && passwordSalt) {
      const calculatedHash = hashPassword(password, passwordSalt);
      isPasswordValid = calculatedHash === passwordHash;
      
      // Log hash comparison (for debugging only - remove in production)
      debugLog(`Hash comparison:`, { 
        calculatedHash: calculatedHash ? calculatedHash.substring(0, 10) + '...' : 'none',
        matches: isPasswordValid
      });
      
      // DEVELOPMENT ONLY: Fallback verification for the development password
      // This allows 'Voter123?' to work for all users in the dev environment
      // without hardcoding specific user IDs
      if (!isPasswordValid && password === 'Voter123?') {
        debugLog(`Standard hash verification failed, but using development password override`);
        isPasswordValid = true;
      }
    } else {
      debugLog(`Login failed: Missing password hash or salt for user`);
      return res.status(401).json({
        success: false,
        message: 'User account not properly configured. Please contact administrator.'
      });
    }
    
    if (isPasswordValid) {
      // Generate simple token (in a real app, use JWT)
      const token = 'token_' + Buffer.from(Math.random().toString() + Date.now()).toString('base64');
      
      // Update last login time and wallet address if provided
      const updatedUsers = users.map(u => {
        if (u.nationalId === nationalId) {
          return {
            ...u,
            lastLogin: new Date().toISOString(),
            walletAddress: walletAddress || u.walletAddress // Update wallet address if provided
          };
        }
        return u;
      });
      
      // Save updated users
      fs.writeFileSync(
        path.join(__dirname, 'Database_API', 'users.json'),
        JSON.stringify({ users: updatedUsers }, null, 2)
      );
      
      // Get the updated user
      const updatedUser = updatedUsers.find(u => u.nationalId === nationalId);
      
      debugLog(`Login successful for user: ${user.id} (${user.role})`);
      
      // Send successful response with correct role from the user object
      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          nationalId: user.nationalId,
          role: user.role, // Use the role directly from the user object
          walletAddress: updatedUser.walletAddress || walletAddress
        }
      });
    } else {
      debugLog(`Login failed: Invalid password for National ID ${nationalId}`);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    debugLog(`Login error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
  console.log(`Login page available at http://localhost:${PORT}/login.html`);
  console.log(`IMPORTANT: Make sure the Database API is running at http://localhost:8000`);
}); 