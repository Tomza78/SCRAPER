@echo off
TITLE Reddit Scraper Daily
echo Starting Reddit Trends Scraper Server...
echo ----------------------------------------
cd /d "%~dp0"
start "" http://localhost:3000
npm start
pause
