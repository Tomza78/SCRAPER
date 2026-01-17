# Reddit Scraper - Setup & Daily Update Instructions

## Problem Fixed
The app wasn't updating daily because:
1. The cron job only works when the server is running
2. The server wasn't running 24/7
3. No standalone script existed to run independently

## Solutions Implemented

### Option 1: Standalone Daily Job Script (RECOMMENDED)
Use Windows Task Scheduler to run the job automatically every day.

#### Setup Steps:

1. **Open Windows Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create a New Task**
   - Click "Create Basic Task" in the right panel
   - Name: `Reddit Scraper Daily Job`
   - Description: `Runs daily Reddit trends scraper at 8:00 AM`

3. **Set Trigger**
   - Click "Next"
   - Select "Daily"
   - Set time: `8:00 AM`
   - Start date: Today

4. **Set Action**
   - Click "Next"
   - Select "Start a program"
   - Program/script: Browse to `run_daily_job.bat` in your project folder
   - Start in (optional): Your project folder path

5. **Finish Setup**
   - Check "Open Properties dialog"
   - Click "Finish"

6. **Configure Additional Settings**
   - In Properties dialog, go to "Conditions" tab
   - **UNCHECK** "Start the task only if the computer is on AC power"
   - Click "OK"

#### Manual Testing:
```bash
# Just double-click or run:
run_daily_job.bat

# Or from command line:
node run_daily_job.js
```

### Option 2: Run Server 24/7 with Cron
If you prefer keeping the server running:

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Keep it running 24/7** - The cron job will run automatically at 8:00 AM daily

3. **Enhanced features added**:
   - Better logging with timestamps
   - Timezone support (Asia/Jerusalem)
   - Manual trigger endpoint: `POST http://localhost:3000/api/run-job`

#### Manual trigger via API:
```bash
# Using curl (if installed):
curl -X POST http://localhost:3000/api/run-job

# Or use Postman, or any HTTP client
```

## Files Created/Modified

### New Files:
- `run_daily_job.js` - Standalone script for daily job
- `run_daily_job.bat` - Windows batch file for Task Scheduler
- `start_server_background.bat` - Start server in background
- `test_scraper.js` - Test scraper functionality
- `test_daily_job.js` - Test full daily job workflow
- `SETUP_INSTRUCTIONS.md` - This file

### Modified Files:
- `src/server.js` - Enhanced logging, timezone support, manual trigger endpoint

## Verification

### Check if daily job is working:
1. Look at the timestamp on `public/data.js`:
   ```bash
   node -e "const fs = require('fs'); const stat = fs.statSync('./public/data.js'); console.log('Last updated:', stat.mtime);"
   ```

2. Check the server logs for:
   - `CRON JOB TRIGGERED` messages
   - `✓ Daily job completed successfully` messages

### Test manually:
```bash
# Test just the scraper:
node test_scraper.js

# Test the full workflow:
node test_daily_job.js

# Run the actual daily job:
node run_daily_job.js
```

## Troubleshooting

### Data not updating?
1. Check if Task Scheduler task is enabled
2. Check Task Scheduler history for errors
3. Run `run_daily_job.bat` manually to see errors
4. Verify `.env` file has all required keys:
   - `GOOGLE_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT_PATH` (or `SERVICE_ACCOUNT_PATH`)

### Server not running?
1. Check if port 3000 is already in use
2. Check console for error messages
3. Verify Firebase credentials are correct

### Cron not triggering?
1. Make sure server is running continuously
2. Check server logs for cron messages
3. Verify timezone setting in `src/server.js`

## Recommended Approach

**Use Option 1 (Windows Task Scheduler)** because:
- ✓ Runs independently without keeping server open
- ✓ More reliable for daily tasks
- ✓ Doesn't consume resources when not needed
- ✓ Easy to monitor via Task Scheduler

Keep the server (`npm start`) only when you need the web interface.

## Current Status

✓ Daily job tested and working
✓ Data freshly updated (15 trends processed)
✓ All new trends saved to Firebase
✓ HTML report generated successfully

Last successful run: Check `public/data.js` modification date
