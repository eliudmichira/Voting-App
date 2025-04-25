@echo off
title Voting App Startup
echo Starting Blockchain Voting Application...
echo.

REM Store batch file directory
set "APP_DIR=%CD%"
echo Working directory: %APP_DIR%

REM Create new Windows for each process
echo Starting Database API...
start "Database API" cmd /k "cd Database_API && cls && npm start"

REM Wait a moment for the DB API to initialize
echo Waiting for Database API to initialize...
timeout /t 3 /nobreak > nul

echo.
echo ======================================================
echo BLOCKCHAIN SETUP
echo ======================================================
echo.
echo Compiling smart contracts...
call truffle compile

echo.
echo Migrating smart contracts to blockchain...
echo This will deploy your contracts to Ganache

REM Capture migration output to a file
call truffle migrate --reset > "%APP_DIR%\latest-migration.log"

echo.
echo Deployment completed! Your contract is now available on the blockchain.
echo Migration logs saved to latest-migration.log

REM Extract contract address from migration log
echo.
echo Contract deployment information:
findstr "contract address" "%APP_DIR%\latest-migration.log"
echo.
echo The app will automatically load this contract address.
echo.

echo ======================================================
echo STARTING WEB SERVER
echo ======================================================
echo.
echo Starting web server...
start "Web Server" cmd /k "cls && node server.js"

echo.
echo ======================================================
echo APPLICATION READY
echo ======================================================
echo.
echo All services started! Launching browser...
echo.
echo FEATURES:
echo  - Contract Health Monitor: View real-time contract status and gas costs
echo  - Blockchain Event Listener: Get notifications for blockchain events
echo  - Network Detection: Ensures you're using the correct blockchain network
echo  - Deployment Config Manager: Save and manage deployment configurations
echo.
echo Access the app at http://localhost:8080
echo.

REM Wait a moment for the server to initialize
timeout /t 3 /nobreak > nul

REM Open the browser
start http://localhost:8080

echo.
echo Press any key to exit this window...
pause > nul 