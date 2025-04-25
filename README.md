# Blockchain-Based Voting Application

A decentralized voting application built with Ethereum smart contracts and a modern web interface.

## Features

- **Secure Voting**: Blockchain-based voting ensures immutability and transparency
- **Smart Contract Integration**: Utilizes Ethereum smart contracts for voting logic
- **Real-time Updates**: Get notifications for blockchain events
- **Network Detection**: Automatically detects and switches to the correct blockchain network
- **Deployment Tracking**: Captures and displays deployment statistics and gas costs
- **Contract Health Monitoring**: Real-time status and gas cost estimation

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript with Tailwind CSS
- **Backend**: Node.js with Express
- **Blockchain**: Ethereum (Ganache for local development)
- **Smart Contracts**: Solidity with Truffle
- **Web3 Integration**: Web3.js for blockchain interaction

## Quick Start

1. Install dependencies:
   ```
   npm install
   ```

2. Start the application with a single command:
   ```
   start-voting-app.bat
   ```

This will:
- Start the Database API
- Compile and deploy smart contracts
- Start the web server
- Open the application in your browser

## Development Setup

### Prerequisites

- Node.js and npm
- Ganache (local blockchain)
- Truffle

### Manual Start

1. Start the Database API:
   ```
   cd Database_API
   npm start
   ```

2. Compile and deploy contracts:
   ```
   truffle compile
   truffle migrate
   ```

3. Start the web server:
   ```
   node server.js
   ```

## Smart Contract Details

The application uses a Voting smart contract that allows:
- Adding candidates
- Casting votes
- Setting voting periods
- Viewing election results

## Project Structure

- `/contracts` - Solidity smart contracts
- `/migrations` - Truffle migration scripts
- `/src` - Application source code
  - `/js` - JavaScript files
  - `/html` - HTML templates
  - `/css` - Stylesheets
  - `/assets` - Static assets
- `/Database_API` - Backend API for database operations

## License

MIT