/**
 * Standalone script to run the daily job
 * Can be executed by Windows Task Scheduler or manually
 */

require('dotenv').config();
const { fetchTopTrends } = require('./src/scraper');
const { summarizePost, categorizePost, summarizeComments } = require('./src/ai');
const { initDB, getTrend, saveTrend } = require('./src/db');
const path = require('path');
const fs = require('fs');

// Generate HTML Report
function generateHTMLReport(trends) {
    const dataJsContent = `window.dailyTrends = ${JSON.stringify(trends, null, 2)};`;
    fs.writeFileSync(path.join(__dirname, 'public/data.js'), dataJsContent);
    console.log('✓ Report data generated at public/data.js');
}

// Main logic to fetch and process data
async function runDailyJob() {
    const jobStartTime = new Date();
    console.log(`\n${'='.repeat(70)}`);
    console.log(`DAILY JOB STARTED: ${jobStartTime.toLocaleString()}`);
    console.log(`${'='.repeat(70)}\n`);

    try {
        // Initialize Database
        console.log('Step 0: Initializing Firebase...');
        initDB();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Firebase init

        // 1. Fetch Candidates (up to 48h old)
        console.log('\nStep 1: Fetching trends from Reddit...');
        const rawTrends = await fetchTopTrends();
        const processedTrends = [];

        console.log(`✓ Fetched ${rawTrends.length} potential candidates.`);

        if (rawTrends.length === 0) {
            console.warn('⚠ WARNING: No trends were fetched from Reddit!');
            process.exit(1);
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
                console.log(`  [CACHED] ${trend.title.substring(0, 60)}...`);
                processedTrends.push(existingTrend);
                continue;
            }

            console.log(`  [NEW] Processing: ${trend.title.substring(0, 60)}...`);

            // 3. AI Categorization & Filtering
            const category = await categorizePost(trend.title);

            if (!category) {
                console.log(`    ↳ Skipped (not finance-related)`);
                continue;
            }

            console.log(`    ↳ Category: ${category}`);

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
            console.log(`    ↳ ✓ Saved to database`);
        }

        // Update the HTML report
        if (processedTrends.length > 0) {
            console.log(`\nStep 2: Generating HTML report...`);
            generateHTMLReport(processedTrends);
            console.log(`✓ Updated report with ${processedTrends.length} trends.`);
        } else {
            console.log("\n⚠ No finance-related trends found in this run.");
        }

        const jobEndTime = new Date();
        const duration = ((jobEndTime - jobStartTime) / 1000).toFixed(2);

        console.log(`\n${'='.repeat(70)}`);
        console.log(`✓ DAILY JOB COMPLETED SUCCESSFULLY`);
        console.log(`  Duration: ${duration} seconds`);
        console.log(`  Processed: ${processedTrends.length} trends`);
        console.log(`  Time: ${jobEndTime.toLocaleString()}`);
        console.log(`${'='.repeat(70)}\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR in daily job:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the job
runDailyJob();
