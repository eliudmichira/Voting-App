@echo off
echo Starting Blockchain Voting App Development Environment...
echo.

REM Change to the directory where the batch file is located
cd /d %~dp0

REM Make sure Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    goto :error
)

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    goto :error
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found in the current directory.
    echo Please run this batch file from the project root directory.
    echo.
    goto :error
)

echo Starting the development environment...
echo This will start both the Database API and Web Server.
echo.
echo Press Ctrl+C to stop all services when done.
echo.

REM Run the development environment
npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred while running the development environment.
    echo Please check the console output above for more details.
    goto :error
)

goto :end

:error
echo.
echo ===============================================
echo    Development environment startup failed!
echo ===============================================
echo.
echo If you need help, please refer to the README.md file or contact support.
echo.
pause
exit /b 1

:end
pause 