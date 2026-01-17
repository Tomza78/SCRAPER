@echo off
REM Batch file to run the daily Reddit scraper job
REM Can be scheduled with Windows Task Scheduler

TITLE Reddit Scraper - Daily Job
echo ========================================
echo Reddit Trends Scraper - Daily Job
echo ========================================
echo.
echo Started at: %date% %time%
echo.

cd /d "%~dp0"

REM Run the daily job
node run_daily_job.js

echo.
echo Completed at: %date% %time%
echo.

REM Keep window open for 5 seconds to see result
timeout /t 5 /nobreak >nul
