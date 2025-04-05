#!/bin/bash

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Function to print error message and exit
print_error() {
    echo -e "\n${RED}===============================================${RESET}"
    echo -e "${RED}    Development environment startup failed!${RESET}"
    echo -e "${RED}===============================================${RESET}"
    echo -e "\n$1"
    echo -e "\nIf you need help, please refer to the README.md file or contact support."
    exit 1
}

echo -e "${GREEN}Starting Blockchain Voting App Development Environment...${RESET}"
echo ""

# Change to the directory where the script is located
cd "$(dirname "$0")"

# Make sure Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "ERROR: Node.js is not installed or not in your PATH.\nPlease install Node.js from https://nodejs.org/"
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "ERROR: npm is not installed or not in your PATH.\nPlease install Node.js from https://nodejs.org/"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "ERROR: package.json not found in the current directory.\nPlease run this script from the project root directory."
fi

echo -e "${BLUE}Starting the development environment...${RESET}"
echo "This will start both the Database API and Web Server."
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services when done.${RESET}"
echo ""

# Run the development environment
npm run dev

# Check if npm run dev exited with an error
if [ $? -ne 0 ]; then
    print_error "An error occurred while running the development environment.\nPlease check the console output above for more details."
fi

# Script completed successfully
echo -e "\n${GREEN}Development environment has stopped.${RESET}" 