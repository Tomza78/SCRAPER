const express = require('express');
const { fetchTopTrends } = require('./scraper');
const { summarizePost, categorizePost, summarizeComments } = require('./ai');
const { initDB, saveTrend, trendExists, getTrend, getTrendsByDate } = require('./db');
const cron = require('node-cron');
const open = require('open');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Redirect root to template.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/template.html'));
});

console.log('App middleware initialized.');

let latestTrends = [];

// Main logic to fetch and process data
async function runDailyJob() {
    const jobStartTime = new Date();
    console.log(`[${jobStartTime.toLocaleString()}] Starting daily job...`);

    try {
        // 1. Fetch Candidates (up to 48h old)
        console.log('Step 1: Fetching trends from Reddit...');
        const rawTrends = await fetchTopTrends();
        const processedTrends = [];

        console.log(`✓ Fetched ${rawTrends.length} potential candidates.`);

        if (rawTrends.length === 0) {
            console.warn('⚠ WARNING: No trends were fetched from Reddit!');
            return;
        }

        for (const trend of rawTrends) {
            // 2. Check if we already have this post processed in DB
            let existingTrend = null;
            try {
                existingTrend = await getTrend(trend.id);
            } catch (err) {
                console.error(`Error checking DB for ${trend.id}:`, err.message);
            }

            if (existingTrend) {
                console.log(`Using existing data for: ${trend.title}`);
                processedTrends.push(existingTrend);
                continue;
            }

            console.log(`Processing NEW: ${trend.title}`);

            // 3. AI Categorization & Filtering
            const category = await categorizePost(trend.title);

            if (!category) {
                console.log(`Skipping non-finance post: ${trend.title}`);
                continue;
            }

            // 4. Summarize Post
            const summary = await summarizePost(trend.title, trend.selftext);

            // 5. Summarize Comments
            const commentsSummary = await summarizeComments(trend.top_comments);

            const processedPost = {
                ...trend,
                summary_he: summary,
                category_he: category,
                comments_summary_he: commentsSummary
            };

            // 6. Save new trend
            await saveTrend(processedPost);
            processedTrends.push(processedPost);
        }

        // Always update latestTrends and the HTML report with whatever is CURRENTLY hot
        latestTrends = processedTrends;

        if (latestTrends.length > 0) {
            generateHTMLReport(latestTrends);
            console.log(`✓ Updated report with ${latestTrends.length} trends.`);
        } else {
            console.log("⚠ No finance-related trends found in this run.");
        }

        const jobEndTime = new Date();
        const duration = ((jobEndTime - jobStartTime) / 1000).toFixed(2);
        console.log(`\n✓ Daily job completed successfully in ${duration} seconds`);
        console.log(`  - Processed: ${processedTrends.length} trends`);
        console.log(`  - Time: ${jobEndTime.toLocaleString()}\n`);
    } catch (error) {
        console.error('\n❌ ERROR in daily job:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Generate HTML Report
function generateHTMLReport(trends) {
    const templatePath = path.join(__dirname, '../public/template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    const dataJsContent = `window.dailyTrends = ${JSON.stringify(trends, null, 2)};`;
    fs.writeFileSync(path.join(__dirname, '../public/data.js'), dataJsContent);
    console.log('Report data generated at public/data.js');
}



// API to get historical trends
app.get('/api/history', async (req, res) => {
    try {
        const { getTrendsByDate } = require('./db');
        const trends = await getTrendsByDate();
        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Start Server
app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);

    // Check Config
    console.log('Checking Environment:');
    console.log(`- APIFY_TOKEN: ${process.env.APIFY_TOKEN ? 'OK' : 'MISSING'}`);
    console.log(`- GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'OK' : 'MISSING'}`);
    console.log(`- FIREBASE_SERVICE_ACCOUNT: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.SERVICE_ACCOUNT_PATH ? 'OK' : 'MISSING'}`);

    initDB();

    // Check if we have data, if not run job immediately (for first run)
    if (latestTrends.length === 0) {
        try {
            if (fs.existsSync(path.join(__dirname, '../public/data.js'))) {
                console.log("Found existing data.js");
            } else {
                console.log("No data found. Running initial job...");
                await runDailyJob();
            }
        } catch (e) { console.log("Error checking data:", e) }
    }

    // Schedule cron for 8:00 AM daily
    cron.schedule('0 8 * * *', () => {
        const now = new Date();
        console.log(`\n${'='.repeat(60)}`);
        console.log(`CRON JOB TRIGGERED at ${now.toLocaleString()}`);
        console.log(`${'='.repeat(60)}\n`);
        runDailyJob();
    }, {
        scheduled: true,
        timezone: "Asia/Jerusalem" // Set to your timezone
    });

    console.log('✓ Cron job scheduled for 8:00 AM daily (Asia/Jerusalem timezone)');

    // Also add an API endpoint to manually trigger the job
    app.post('/api/run-job', async (req, res) => {
        console.log('\n[MANUAL TRIGGER] Daily job started via API');
        try {
            await runDailyJob();
            res.json({ success: true, message: 'Daily job completed successfully' });
        } catch (error) {
            console.error('[MANUAL TRIGGER] Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
});
