# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reddit Finance Trends Scraper - A Node.js application that scrapes financial content from Reddit, processes it with AI (Google Gemini), and presents a Hebrew-language dashboard with trends analysis.

**Key Technologies:**
- Express.js web server
- Google Gemini AI (gemini-3-flash-preview)
- Firebase Firestore (database)
- Reddit JSON API (direct scraping, no Apify dependency)
- GitHub Actions (automated scheduling)
- node-cron (local scheduling alternative)

## Commands

### Running the Application

```bash
# Start the web server (runs on port 3000)
npm start

# Run daily scraping job manually (standalone, no server needed)
node run_daily_job.js

# Test individual components
node test_scraper.js        # Test Reddit scraper only
node test_daily_job.js      # Test full workflow
node test_ai.js             # Test AI categorization/summarization
```

### Windows Automation

```bash
# Run daily job via batch file (for Task Scheduler)
run_daily_job.bat

# Start server in background
start_server_background.bat
```

## Architecture Overview

### Data Flow

1. **Scraping Phase** (src/scraper.js)
   - Fetches hot posts from 5 finance subreddits: economics, finance, investing, StockMarket, business
   - Filters posts by age (max 48 hours old) and content length (min 20 chars)
   - Fetches top 3 comments for each post
   - Returns up to 15 candidates sorted by score

2. **AI Processing Phase** (src/ai.js)
   - **Categorization**: Determines if post is finance-related and assigns Hebrew category
   - **Post Summarization**: Generates 2-3 sentence Hebrew summary
   - **Comments Summarization**: Extracts 6 distinct opinions from top comments in Hebrew
   - All AI calls use Google Gemini API

3. **Database Layer** (src/db.js)
   - Checks if post already processed (deduplication via `getTrend()`)
   - Saves processed trends to Firestore with timestamp
   - Each trend stored with unique Reddit post ID as document ID

4. **Report Generation** (src/server.js)
   - Generates `public/data.js` with processed trends as JavaScript object
   - Front-end (`public/template.html`) displays dark-themed dashboard
   - Historical view available at `public/history.html`

### Dual Execution Modes

The application supports two execution patterns:

**Mode 1: Web Server (src/server.js)**
- Runs continuously on port 3000
- Hosts dashboard at http://localhost:3000
- Cron job triggers daily at 8:00 AM (Asia/Jerusalem timezone)
- Manual trigger endpoint: `POST /api/run-job`
- History API: `GET /api/history`

**Mode 2: Standalone Script (run_daily_job.js)**
- Independent execution without web server
- Ideal for Windows Task Scheduler
- Same processing logic as server-based cron
- Exits after completion

### Critical Implementation Details

**Post Age Window**: Posts must be less than 48 hours old (configurable in src/scraper.js:28)

**Deduplication Strategy**:
- Before processing, checks Firebase for existing post by ID
- If found, reuses cached data instead of re-processing with AI
- This saves API costs and processing time

**Comment Filtering**:
- Only comments with 30+ characters
- Excludes emoji-only comments
- Takes top 3 by score

**AI Model Configuration**:
- Model: `gemini-3-flash-preview` (configured in src/ai.js:8)
- Can be changed to `gemini-2.0-flash` if needed
- Performance: ~18-19 seconds per post for full AI processing

**Error Handling**:
- Firebase path fallback: Tries `FIREBASE_SERVICE_ACCOUNT_PATH` env var, then `SERVICE_ACCOUNT_PATH`, then `./serviceAccountKey.json`
- AI failures return Hebrew fallback text instead of crashing

## Environment Variables

Required in `.env` file:

```
APIFY_TOKEN=<token>                              # Legacy, not actively used
GOOGLE_API_KEY=<key>                             # Required for Gemini AI
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
PORT=3000                                         # Optional, defaults to 3000
```

## File Structure (Key Files Only)

```
src/
  ├── server.js      # Express server, cron job, API endpoints
  ├── scraper.js     # Reddit JSON API scraping logic
  ├── ai.js          # Google Gemini AI integration
  └── db.js          # Firebase Firestore operations

public/
  ├── template.html  # Main dashboard (dark theme)
  ├── history.html   # Historical trends view
  └── data.js        # Generated data file (window.dailyTrends)

run_daily_job.js     # Standalone daily job script
run_daily_job.bat    # Windows Task Scheduler wrapper
```

## Scheduled Job Setup

**Production (Recommended): Railway.app + Cron-job.org** ⭐
- Railway hosts the application 24/7 in the cloud
- Cron-job.org triggers the daily scraper via API call
- $5 free credit/month (sufficient for 2-3 months)
- Not blocked by Reddit (unlike GitHub Actions)
- See `RAILWAY_SETUP.md` for complete setup guide

**Alternative: GitHub Actions** (Currently blocked by Reddit)
- Automated daily execution at 8:00 AM (Israel time)
- Free tier provides 2,000 minutes/month
- Currently experiences 403 errors from Reddit
- See `GITHUB_ACTIONS_SETUP.md` for setup instructions
- Workflow file: `.github/workflows/daily-scraper.yml`

**Local Development Options:**

1. **Windows Task Scheduler**: Use `run_daily_job.bat`
   - Runs independently without keeping server open
   - See `SETUP_INSTRUCTIONS.md` for detailed steps
   - Only works when computer is on

2. **Server with cron**: Keep `npm start` running 24/7
   - Cron triggers daily at 8:00 AM (Asia/Jerusalem timezone)
   - Manual trigger: `POST /api/run-job`

## Important Notes

- The application processes trends in Hebrew for Israeli finance professionals
- All AI summaries and categories are generated in Hebrew
- Dashboard uses dark theme with modern UI design
- Historical data persists in Firebase Firestore indefinitely
- The scraper uses Reddit's public JSON endpoints (no authentication required)
- Comment analysis provides 6 distinct community opinions per trend
