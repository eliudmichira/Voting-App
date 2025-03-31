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

5. Start the services:
```bash
# Start Database API
cd Database_API
node server.js

# Start Web Server (in new terminal)
node server.js

# Start React Native App (in new terminal)
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