const { ApifyClient } = require('apify-client');
require('dotenv').config();

const apifyClient = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

/**
 * Fetches top trending posts from Reddit using Apify.
 * @returns {Promise<Array>} Array of posts
 */
async function fetchTopTrends() {
    try {
        console.log('Fetching top trends from Reddit...');
        const run = await apifyClient.actor('fatihtahta/reddit-scraper-search-fast').call({
            subredditName: 'popular',
            subredditSort: 'hot',
            maxPosts: 20, // Fetch a bit more to filter if needed
            scrapeComments: false,
        });

        console.log('Apify run finished. Fetching dataset...');
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        // Filter and map to a simpler structure
        const trends = items.map(item => ({
            id: item.id,
            title: item.title,
            url: item.url,
            author: item.author,
            score: item.score,
            selftext: item.selftext || item.body || '', // selftext or body depending on actor output
            subreddit: item.subreddit,
            created_utc: item.created_utc,
            thumbnail: item.thumbnail
        })).sort((a, b) => b.score - a.score).slice(0, 10);

        return trends;
    } catch (error) {
        console.error('Error fetching trends from Apify:', error);
        throw error;
    }
}

module.exports = { fetchTopTrends };
