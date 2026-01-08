const express = require('express');
const { fetchTopTrends } = require('./scraper');
const { summarizePost, categorizePost, translateContent } = require('./ai');
const { initDB, saveTrends } = require('./db');
const cron = require('node-cron');
const open = require('open');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let latestTrends = [];

// Main logic to fetch and process data
async function runDailyJob() {
    console.log('Starting daily job...');
    try {
        const rawTrends = await fetchTopTrends();
        const processedTrends = [];

        for (const trend of rawTrends) {
            console.log(`Processing: ${trend.title}`);
            const summary = await summarizePost(trend.title, trend.selftext);
            const category = await categorizePost(trend.title);

            processedTrends.push({
                ...trend,
                summary_he: summary,
                category_he: category
            });
        }

        latestTrends = processedTrends;

        // Save to DB
        await saveTrends(processedTrends);

        // Generate static HTML (optional, but requested "Output will be formatted HTML file")
        generateHTMLReport(processedTrends);

        console.log('Daily job completed.');
    } catch (error) {
        console.error('Error in daily job:', error);
    }
}

// Generate HTML Report
function generateHTMLReport(trends) {
    const templatePath = path.join(__dirname, '../public/template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Simple verification that template exists, if not create basic one (handled securely by creating file later)

    // In a real app we might use a template engine, here we'll just inject JSON for client-side rendering
    // or replace a placeholder. Let's use client-side rendering for simplicity.
    // We will save a data.js file that the HTML loads.

    const dataJsContent = `window.dailyTrends = ${JSON.stringify(trends, null, 2)};`;
    fs.writeFileSync(path.join(__dirname, '../public/data.js'), dataJsContent);
    console.log('Report data generated at public/data.js');
}

// API to translate specific text
app.post('/api/translate', async (req, res) => {
    const { text } = req.body;
    try {
        const translation = await translateContent(text);
        res.json({ translation });
    } catch (error) {
        res.status(500).json({ error: 'Translation failed' });
    }
});

// Start Server
app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    initDB();

    // Check if we have data, if not run job immediately (for first run)
    if (latestTrends.length === 0) {
        // Optional: Check if file exists to load previous data?
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
