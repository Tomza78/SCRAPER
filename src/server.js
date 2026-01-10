const express = require('express');
const { fetchTopTrends } = require('./scraper');
const { summarizePost, categorizePost, summarizeComments } = require('./ai');
const { initDB, saveTrend, trendExists } = require('./db');
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
    console.log('Starting daily job...');
    try {
        // 1. Fetch Candidates (already filtered by time and content emptiness)
        const rawTrends = await fetchTopTrends();
        const processedTrends = [];
        const savedTrendsForReport = [];

        console.log(`Fetched ${rawTrends.length} potential candidates.`);

        for (const trend of rawTrends) {
            // 2. Deduplication Check
            const exists = await trendExists(trend.id);
            if (exists) {
                console.log(`Skipping duplicate: ${trend.title} (${trend.id})`);
                continue;
            }

            console.log(`Processing: ${trend.title}`);

            // 3. AI Categorization & Filtering
            const category = await categorizePost(trend.title);

            // If category is null (SKIP), ignore this post
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

            // 6. Save individual trend
            await saveTrend(processedPost);

            processedTrends.push(processedPost);
            savedTrendsForReport.push(processedPost);
        }

        latestTrends = savedTrendsForReport;

        // Generate static HTML for TODAY'S run
        if (savedTrendsForReport.length > 0) {
            generateHTMLReport(savedTrendsForReport);
        } else {
            console.log("No new trends found today.");
        }

        console.log('Daily job completed.');
    } catch (error) {
        console.error('Error in daily job:', error);
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

    // Schedule cron for 8:00 AM
    cron.schedule('0 8 * * *', () => {
        console.log('Running scheduled task at 8:00 AM');
        runDailyJob();
    });
});
