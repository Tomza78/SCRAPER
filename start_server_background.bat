@echo off
REM Start the Reddit Scraper server in the background
TITLE Reddit Scraper Background Service
cd /d "%~dp0"

REM Kill any existing node processes for this app to avoid conflicts
taskkill /F /FI "WINDOWTITLE eq Reddit Scraper Background Service*" >nul 2>&1

REM Start the server without keeping console open
echo Starting Reddit Scraper Server in background...
echo Server will run on http://localhost:3000
echo.
echo To stop the server, close this window or use Task Manager
echo.

REM Start node server - this keeps the console open for monitoring
npm start
