/**
 * One-Click Development Environment Starter for Blockchain Voting App
 * 
 * This script starts all required services for local development:
 * 1. Database API server (running on port 8000)
 * 2. Main web server (running on port 8080)
 * 3. Opens the app in a browser
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const readline = require('readline');

// Path configuration
const rootDir = path.resolve(__dirname, '..');
const dbApiDir = path.join(rootDir, 'Database_API');

// Default and fallback port configuration
const config = {
  dbApi: {
    defaultPort: 8000,
    fallbackPorts: [3000, 8001, 8002, 8003]
  },
  webServer: {
    defaultPort: 8080,
    fallbackPorts: [3001, 8081, 8082, 8083]
  },
  maxRetries: 3,
  retryDelay: 1000 // in milliseconds
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a yes/no question
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

// Get process details running on a specific port
async function getProcessDetailsOnPort(port) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command = '';
    
    if (platform === 'win32') {
      // For Windows, get process ID and then query its details
      command = `netstat -ano | findstr :${port} | findstr LISTENING`;
      exec(command, (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(null);
          return;
        }
        
        // Extract PID from netstat output
        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          // Get process name from PID
          exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (err, stdoutTask) => {
            if (err || !stdoutTask.trim()) {
              resolve({ pid, name: 'Unknown' });
              return;
            }
            
            try {
              // Parse CSV output from tasklist
              const taskParts = stdoutTask.trim().replace(/"/g, '').split(',');
              const processName = taskParts[0];
              resolve({ pid, name: processName });
            } catch (e) {
              resolve({ pid, name: 'Unknown' });
            }
          });
        } else {
          resolve(null);
        }
      });
    } else {
      // For Unix-based systems, use lsof
      command = `lsof -i:${port} | grep LISTEN`;
      exec(command, (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(null);
          return;
        }
        
        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s+/);
          const processName = parts[0];
          const pid = parts[1];
          resolve({ pid, name: processName });
        } else {
          resolve(null);
        }
      });
    }
  });
}

// Check if port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command = '';
    
    if (platform === 'win32') {
      command = `netstat -ano | findstr :${port} | findstr LISTENING`;
    } else {
      command = `lsof -i:${port} | grep LISTEN`;
    }
    
    exec(command, (error, stdout) => {
      resolve(!!stdout.trim());
    });
  });
}

// Log with timestamp and color
function log(message, color = colors.white) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Display a boxed message
function displayBoxedMessage(title, messages, color = colors.yellow) {
  const boxWidth = 80;
  const horizontalLine = '='.repeat(boxWidth);
  
  console.log(`\n${color}${horizontalLine}`);
  
  // Title centered in the box
  const padding = Math.max(0, Math.floor((boxWidth - title.length) / 2));
  console.log(' '.repeat(padding) + title);
  
  console.log(horizontalLine);
  
  // Message content
  messages.forEach(msg => {
    console.log(msg);
  });
  
  console.log(`${horizontalLine}${colors.reset}\n`);
}

// Kill process on a specific port (useful for cleanup)
async function killProcessOnPort(port, retry = 0) {
  return new Promise(async (resolve) => {
    // First, get process details for better user feedback
    const processDetails = await getProcessDetailsOnPort(port);
    
    if (!processDetails) {
      log(`No process found running on port ${port}`, colors.yellow);
      resolve(true); // Consider it a success if no process is found
      return;
    }
    
    log(`Process using port ${port}: ${processDetails.name} (PID: ${processDetails.pid})`, colors.yellow);
    
    // Ask for confirmation if this is not a retry
    if (retry === 0) {
      const shouldKill = await askQuestion(`Do you want to kill this process? (y/n): `);
      if (!shouldKill) {
        log(`Process kill aborted by user.`, colors.yellow);
        resolve(false);
        return;
      }
    }
    
    const platform = os.platform();
    let command = '';
    
    if (platform === 'win32') {
      command = `taskkill /PID ${processDetails.pid} /F`;
    } else {
      command = `kill -9 ${processDetails.pid}`;
    }
    
    exec(command, (error) => {
      if (error) {
        log(`Failed to kill process on port ${port}. Error: ${error.message}`, colors.red);
        resolve(false);
      } else {
        log(`Successfully killed process on port ${port} (${processDetails.name}, PID: ${processDetails.pid})`, colors.green);
        // Verify the port is actually free
        setTimeout(async () => {
          const stillInUse = await isPortInUse(port);
          if (stillInUse && retry < 2) {
            log(`Port ${port} is still in use after kill attempt. Retrying...`, colors.yellow);
            const success = await killProcessOnPort(port, retry + 1);
            resolve(success);
          } else if (stillInUse) {
            log(`Port ${port} couldn't be freed after multiple attempts.`, colors.red);
            resolve(false);
          } else {
            resolve(true);
          }
        }, 500);
      }
    });
  });
}

// Find an available port from a list
async function findAvailablePort(defaultPort, fallbackPorts = []) {
  // First check if the default port is available
  if (!(await isPortInUse(defaultPort))) {
    return defaultPort;
  }
  
  // If not, try fallback ports
  for (const port of fallbackPorts) {
    if (!(await isPortInUse(port))) {
      return port;
    }
  }
  
  // If all ports are in use, return null
  return null;
}

// Start the Database API
async function startDatabaseAPI() {
  log('Starting Database API...', colors.cyan);
  
  let dbPort = config.dbApi.defaultPort;
  let portInUse = await isPortInUse(dbPort);
  
  if (portInUse) {
    log(`Default Database API port ${dbPort} is already in use.`, colors.yellow);
    
    // Get process details
    const processDetails = await getProcessDetailsOnPort(dbPort);
    if (processDetails) {
      log(`Process using port ${dbPort}: ${processDetails.name} (PID: ${processDetails.pid})`, colors.yellow);
      
      // Ask if user wants to kill the process
      const shouldKill = await askQuestion(`Attempt to free port ${dbPort} by killing the process? (y/n): `);
      
      if (shouldKill) {
        log(`Attempting to kill process on port ${dbPort}...`, colors.yellow);
        const killed = await killProcessOnPort(dbPort);
        
        if (killed) {
          log(`Successfully freed port ${dbPort}`, colors.green);
          portInUse = false; // We can use the default port now
        } else {
          log(`Failed to free port ${dbPort}. Will try alternative ports.`, colors.red);
        }
      } else {
        log(`Will try alternative ports.`, colors.yellow);
      }
    }
    
    // If port is still in use, find an available alternative
    if (portInUse) {
      const availablePort = await findAvailablePort(dbPort, config.dbApi.fallbackPorts);
      
      if (availablePort) {
        dbPort = availablePort;
        log(`Using alternative port for Database API: ${dbPort}`, colors.green);
      } else {
        // No available ports, display guidance and abort
        displayBoxedMessage('DATABASE API PORT CONFLICT',
          [
            `${colors.red}Could not find any available ports for the Database API.${colors.yellow}`,
            `Please manually free one of these ports:`,
            `- ${config.dbApi.defaultPort} (default)`,
            `- ${config.dbApi.fallbackPorts.join(', ')} (alternatives)`,
            '',
            `You can free ports by closing other applications or services that are using them.`,
            `${colors.cyan}Troubleshooting steps:${colors.yellow}`,
            `1. Try running 'netstat -ano | findstr :<port>' (Windows) or 'lsof -i:<port>' (macOS/Linux)`,
            `2. Identify the process using the port`,
            `3. Close the application or terminate the process`,
            `4. Run this script again`
          ]
        );
        return null;
      }
    }
  }
  
  log(`Starting Database API on port ${dbPort}...`, colors.cyan);
  
  // Start the Database API server with modified env to use the selected port
  const env = { ...process.env, PORT: dbPort };
  
  const dbProcess = spawn('node', ['server.js'], { 
    cwd: dbApiDir,
    stdio: 'pipe',
    shell: true,
    env
  });
  
  dbProcess.stdout.on('data', (data) => {
    log(`DB API: ${data.toString().trim()}`, colors.cyan);
  });
  
  dbProcess.stderr.on('data', (data) => {
    log(`DB API Error: ${data.toString().trim()}`, colors.red);
  });
  
  // Wait to make sure the server starts properly
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verify the server actually started on the specified port
  let retries = 0;
  while (retries < config.maxRetries) {
    try {
      // Send a request to the health endpoint to check if the server is running
      const checkCommand = os.platform() === 'win32' 
        ? `curl -s http://localhost:${dbPort}/health`
        : `curl -s http://localhost:${dbPort}/health`;
        
      const result = await new Promise(resolve => {
        exec(checkCommand, (error, stdout) => {
          resolve({ error, stdout });
        });
      });
      
      if (!result.error && result.stdout) {
        log(`Database API successfully started on port ${dbPort}`, colors.green);
        return { process: dbProcess, port: dbPort };
      }
    } catch (error) {
      // Ignore errors and continue retrying
    }
    
    retries++;
    log(`Waiting for Database API to start... (attempt ${retries}/${config.maxRetries})`, colors.yellow);
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
  }
  
  // If we get here, the server failed to start
  log(`Database API failed to start after ${config.maxRetries} attempts.`, colors.red);
  dbProcess.kill();
  return null;
}

// Start the Main Web Server
async function startWebServer(dbApiPort) {
  log('Starting Web Server...', colors.magenta);
  
  let webPort = config.webServer.defaultPort;
  let portInUse = await isPortInUse(webPort);
  
  if (portInUse) {
    log(`Default Web Server port ${webPort} is already in use.`, colors.yellow);
    
    // Get process details
    const processDetails = await getProcessDetailsOnPort(webPort);
    if (processDetails) {
      log(`Process using port ${webPort}: ${processDetails.name} (PID: ${processDetails.pid})`, colors.yellow);
      
      // Ask if user wants to kill the process
      const shouldKill = await askQuestion(`Attempt to free port ${webPort} by killing the process? (y/n): `);
      
      if (shouldKill) {
        log(`Attempting to kill process on port ${webPort}...`, colors.yellow);
        const killed = await killProcessOnPort(webPort);
        
        if (killed) {
          log(`Successfully freed port ${webPort}`, colors.green);
          portInUse = false; // We can use the default port now
        } else {
          log(`Failed to free port ${webPort}. Will try alternative ports.`, colors.red);
        }
      } else {
        log(`Will try alternative ports.`, colors.yellow);
      }
    }
    
    // If port is still in use, find an available alternative
    if (portInUse) {
      const availablePort = await findAvailablePort(webPort, config.webServer.fallbackPorts);
      
      if (availablePort) {
        webPort = availablePort;
        log(`Using alternative port for Web Server: ${webPort}`, colors.green);
      } else {
        // No available ports, display guidance and abort
        displayBoxedMessage('WEB SERVER PORT CONFLICT',
          [
            `${colors.red}Could not find any available ports for the Web Server.${colors.yellow}`,
            `Please manually free one of these ports:`,
            `- ${config.webServer.defaultPort} (default)`,
            `- ${config.webServer.fallbackPorts.join(', ')} (alternatives)`,
            '',
            `You can free ports by closing other applications or services that are using them.`,
            `${colors.cyan}Troubleshooting steps:${colors.yellow}`,
            `1. Try running 'netstat -ano | findstr :<port>' (Windows) or 'lsof -i:<port>' (macOS/Linux)`,
            `2. Identify the process using the port`,
            `3. Close the application or terminate the process`,
            `4. Run this script again`
          ]
        );
        return null;
      }
    }
  }
  
  log(`Starting Web Server on port ${webPort}...`, colors.magenta);
  
  // Start the main web server with environment variables
  const env = { 
    ...process.env, 
    PORT: webPort,
    DB_API_PORT: dbApiPort, // Pass the DB API port to the web server
    DB_API_URL: `http://localhost:${dbApiPort}`
  };
  
  const webProcess = spawn('node', ['server.js'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
    env
  });
  
  webProcess.stdout.on('data', (data) => {
    log(`Web Server: ${data.toString().trim()}`, colors.magenta);
  });
  
  webProcess.stderr.on('data', (data) => {
    log(`Web Server Error: ${data.toString().trim()}`, colors.red);
  });
  
  // Wait to make sure the server starts properly
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verify the server actually started on the specified port
  let retries = 0;
  while (retries < config.maxRetries) {
    try {
      // Send a request to the health endpoint to check if the server is running
      const checkCommand = os.platform() === 'win32' 
        ? `curl -s http://localhost:${webPort}/api/health`
        : `curl -s http://localhost:${webPort}/api/health`;
        
      const result = await new Promise(resolve => {
        exec(checkCommand, (error, stdout) => {
          resolve({ error, stdout });
        });
      });
      
      if (!result.error && result.stdout) {
        log(`Web Server successfully started on port ${webPort}`, colors.green);
        return { process: webProcess, port: webPort };
      }
    } catch (error) {
      // Ignore errors and continue retrying
    }
    
    retries++;
    log(`Waiting for Web Server to start... (attempt ${retries}/${config.maxRetries})`, colors.yellow);
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
  }
  
  // If we get here, the server failed to start
  log(`Web Server failed to start after ${config.maxRetries} attempts.`, colors.red);
  webProcess.kill();
  return null;
}

// Open the app in a browser
function openBrowser(webPort) {
  log('Opening app in browser...', colors.green);
  const platform = os.platform();
  let command = '';
  
  const url = `http://localhost:${webPort}/login.html`;
  
  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }
  
  exec(command, (error) => {
    if (error) {
      log(`Failed to open browser: ${error.message}`, colors.red);
      log(`Please open this URL manually: ${url}`, colors.yellow);
    } else {
      log(`Browser opened successfully at ${url}`, colors.green);
    }
  });
}

// Main function to start everything
async function startDevelopmentEnvironment() {
  log('🚀 Starting Blockchain Voting App Development Environment', colors.green);
  
  // Start Database API
  const dbResult = await startDatabaseAPI();
  if (!dbResult) {
    log('Failed to start Database API. Aborting...', colors.red);
    rl.close();
    process.exit(1);
  }
  
  // Start Web Server
  const webResult = await startWebServer(dbResult.port);
  if (!webResult) {
    log('Failed to start Web Server. Shutting down...', colors.red);
    dbResult.process.kill();
    rl.close();
    process.exit(1);
  }
  
  log('✅ All services started successfully!', colors.green);
  log(`🔗 Database API running at: http://localhost:${dbResult.port}`, colors.blue);
  log(`🔗 Web Server running at: http://localhost:${webResult.port}`, colors.blue);
  log(`📱 Open the app at: http://localhost:${webResult.port}/login.html`, colors.green);
  
  // Open the app in the browser
  setTimeout(() => openBrowser(webResult.port), 2000);
  
  // Display helpful information for handling issues
  displayBoxedMessage('DEVELOPMENT ENVIRONMENT RUNNING',
    [
      `${colors.green}Your development environment is now running!${colors.yellow}`,
      '',
      `Database API: ${colors.cyan}http://localhost:${dbResult.port}${colors.yellow}`,
      `Web Server:   ${colors.cyan}http://localhost:${webResult.port}${colors.yellow}`,
      `Login Page:   ${colors.cyan}http://localhost:${webResult.port}/login.html${colors.yellow}`,
      '',
      `${colors.cyan}KEYBOARD SHORTCUTS:${colors.yellow}`,
      `- Press ${colors.white}Ctrl+C${colors.yellow} to gracefully shutdown all services`,
      `- Press ${colors.white}Ctrl+R${colors.yellow} in your browser to refresh the application`,
      '',
      `${colors.cyan}TROUBLESHOOTING:${colors.yellow}`,
      `- If you encounter any issues, check the console output for errors`,
      `- Ensure MetaMask is installed in your browser for wallet features`,
      `- For additional help, refer to the README.md file`
    ],
    colors.yellow
  );
  
  // Handle graceful shutdown
  const cleanUp = () => {
    log('Shutting down development environment...', colors.yellow);
    
    webResult.process.kill();
    dbResult.process.kill();
    
    rl.close();
    log('All processes terminated. Goodbye!', colors.green);
    process.exit(0);
  };
  
  // Listen for exit signals
  process.on('SIGINT', cleanUp);
  process.on('SIGTERM', cleanUp);
  
  // Also handle Windows CTRL+C event
  if (process.platform === 'win32') {
    process.on('SIGBREAK', cleanUp);
  }
}

// Run the main function
startDevelopmentEnvironment().catch(error => {
  log(`Error starting development environment: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
}); 