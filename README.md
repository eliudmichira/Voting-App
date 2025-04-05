# Blockchain-Based Electoral Management System

A secure, transparent, and decentralized voting system built using blockchain technology.

## Overview

This system provides a robust platform for conducting secure elections using blockchain technology, ensuring transparency and immutability of votes while maintaining voter privacy.

## Features

- **Enhanced Security**: Multi-factor authentication with National ID and blockchain wallet verification
- **Interactive UI**: Dynamic particles background and modern interface design
- **MetaMask Integration**: Seamless wallet connection with real-time status updates
- **Dual Authentication**: National ID + Blockchain wallet ensures voter identity integrity
- **Admin Dashboard**: Comprehensive election management interface with real-time monitoring
- **Real-Time Results**: Immediate and transparent vote counting with blockchain verification
- **Responsive Design**: Optimized for all devices with dark/light theme support

## System Requirements

- Node.js (v14 or later)
- MetaMask browser extension
- PowerShell (Windows) or Terminal (Unix)
- Modern web browser (Chrome, Firefox, Edge)
- Git

## Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/eliudmichira/Blockchain-Based-Electoral-Management-System.git
cd Blockchain-Based-Electoral-Management-System
```

2. Install dependencies:
```bash
npm install
cd Database_API
npm install
cd ..
```

3. Configure environment:
Create `.env` files in root and Database_API directories with appropriate settings. Example variables:
- `API_PORT`
- `DB_HOST`
- `PRIVATE_KEY`
- `INFURA_URL`

4. Compile and Deploy Smart Contracts:
Use Truffle to compile and deploy your Solidity smart contracts:
```bash
npx truffle compile
npx truffle migrate --network <network_name>
```
Replace `<network_name>` with the appropriate network configuration (e.g., `development`, `ropsten`, `mainnet`) as defined in your `truffle-config.js`.

## One-Click Development Environment

For easier local development, we've created a one-click solution that starts all necessary services at once:

### Using npm script
```bash
npm run dev
```

### Windows users
Double-click the `start-dev.bat` file in the project root directory.

### macOS/Linux users
Make the script executable and run it:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

This will automatically:
1. Start the Database API on port 8000
2. Start the Web Server on port 8080
3. Open the application in your default browser
4. Handle graceful shutdown of all services when you press Ctrl+C

### Enhanced Port Handling

The development environment now includes intelligent port management:

- **Port Conflict Detection**: Automatically detects if default ports (8000 for Database API, 8080 for Web Server) are already in use
- **Process Information**: Shows which applications are using conflicting ports
- **User Choice**: Provides options to kill conflicting processes or use alternative ports
- **Fallback Ports**: Automatically tries alternative ports if default ones are unavailable:
  - Database API fallbacks: 3000, 8001, 8002, 8003
  - Web Server fallbacks: 3001, 8081, 8082, 8083
- **Detailed Guidance**: If no ports are available, provides specific troubleshooting steps
- **Real-time Status**: Shows service status with color-coded output and clear URLs

### Troubleshooting Port Conflicts

If you encounter port conflicts:

1. The script will show which process is using the port and ask if you want to terminate it
2. You can choose to let the script try alternative ports automatically
3. If all ports are unavailable, follow the on-screen troubleshooting guidance
4. You can manually free ports by stopping services like:
   - Other development servers
   - Docker containers
   - Local web servers (Apache, Nginx, etc.)

### Additional Development Commands

For more fine-grained control, you can still use the individual commands:

```bash
# Start Database API only
cd Database_API
node server.js

# Start Web Server only
node server.js

# Start React Native App (for mobile development)
npx expo start
```

## Project Structure

```
project/
├── Database_API/        # Separate Node.js backend API service for database operations
│   ├── node_modules/
│   ├── server.js        # API server entry point
│   ├── package.json
│   └── users.json       # (Note: Consider replacing with a database)
├── contracts/           # Solidity smart contracts
├── migrations/          # Truffle deployment scripts
├── node_modules/        # Root project dependencies (including web server and potentially dev tools)
├── public/              # Static assets (if serving a web build)
├── scripts/             # Development and utility scripts
│   ├── dev-start.js     # One-click development script
│   └── update-server-ip.js # IP configuration for mobile development
├── src/                 # Frontend source code (likely React Native/shared)
│   ├── components/
│   ├── pages/ or screens/
│   ├── utils/
│   ├── assets/
│   └── ... (other frontend specific dirs)
├── .expo/               # Expo generated files
├── App.jsx              # React Native main application component
├── app.json             # Expo configuration file
├── babel.config.js      # Babel configuration
├── server.js            # Root web server (potentially serves frontend or handles specific routes)
├── start-dev.bat        # Windows batch file for one-click development
├── start-dev.sh         # Unix shell script for one-click development
├── truffle-config.js    # Truffle configuration
├── package.json         # Root project package file
├── .env                 # Root environment variables
└── README.md
```

## Technology Stack

- **Frontend:** React Native, Expo
- **Backend:** Node.js, Express
- **Blockchain:** Solidity, Truffle
- **Wallet Integration:** MetaMask
- **Database:** (Consider replacing `users.json` with a real database like MongoDB or PostgreSQL)
- **Other Tools:** Babel, Git, PowerShell/Terminal

## Author

Eliud Michira

© 2025 All rights reserved.

---
Note: This system is a proprietary solution. Unauthorized use, modification, or distribution is prohibited.