const axios = require('axios');
require('dotenv').config();

const ARCTIC_SHIFT_BASE = 'https://arctic-shift.photon-reddit.com/api';

/**
 * Fetches top trending posts from Reddit using Arctic Shift API (no authentication required).
 * Falls back to PullPush API if Arctic Shift is unavailable.
 * @returns {Promise<Array>} Array of post objects
 */
async function fetchTopTrends() {
    try {
        const subreddits = ['economics', 'finance', 'investing', 'StockMarket', 'business'];
        let allItems = [];

        const now = Math.floor(Date.now() / 1000);
        const afterEpoch = now - (48 * 60 * 60); // 48 hours ago in epoch seconds

        console.log('Fetching top trends from Arctic Shift API...');

        for (const sub of subreddits) {
            try {
                // Add delay between requests to be respectful
                if (allItems.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                const response = await axios.get(`${ARCTIC_SHIFT_BASE}/posts/search`, {
                    params: {
                        subreddit: sub,
                        sort: 'desc',
                        sort_type: 'created_utc',
                        limit: 100,
                        after: afterEpoch
                    },
                    headers: {
                        'User-Agent': 'finance-scraper/1.0'
                    },
                    timeout: 30000
                });

                if (response.data && response.data.data) {
                    const posts = response.data.data;
                    console.log(`  r/${sub}: ${posts.length} posts found`);
                    allItems = allItems.concat(posts);
                }
            } catch (err) {
                console.error(`Error fetching r/${sub}:`, err.message);
            }
        }

        console.log(`Total posts fetched: ${allItems.length}`);

        // 1. Filter and sort
        const candidates = allItems
            .filter(item => {
                const content = item.selftext || item.body || '';
                const title = item.title || '';
                if (!title) return false;
                if (!content || content.trim().length < 20) return false;
                return true;
            })
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 15);

        console.log(`Found ${candidates.length} valid candidates. Fetching comments...`);

        // 2. Fetch Comments for each candidate
        const trends = [];
        for (const item of candidates) {
            let topComments = [];
            try {
                // Add delay between comment requests
                await new Promise(resolve => setTimeout(resolve, 1500));

                const commResponse = await axios.get(`${ARCTIC_SHIFT_BASE}/comments/search`, {
                    params: {
                        link_id: `t3_${item.id}`,
                        sort: 'desc',
                        sort_type: 'created_utc',
                        limit: 50
                    },
                    headers: {
                        'User-Agent': 'finance-scraper/1.0'
                    },
                    timeout: 30000
                });

                if (commResponse.data && commResponse.data.data) {
                    topComments = commResponse.data.data
                        .filter(c => {
                            const body = c.body || '';
                            // Filter: length > 30, not just emojis
                            return body.length > 30 && !/^[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]+$/u.test(body);
                        })
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .slice(0, 3)
                        .map(c => ({
                            body: c.body,
                            score: c.score,
                            author: c.author
                        }));
                }
                console.log(`  Comments for "${item.title.substring(0, 40)}...": ${topComments.length} found`);
            } catch (err) {
                console.warn(`Could not fetch comments for ${item.id}:`, err.message);
            }

            const permalink = item.permalink || `/r/${item.subreddit}/comments/${item.id}/`;

            trends.push({
                id: item.id,
                title: item.title,
                url: `https://www.reddit.com${permalink}`,
                author: item.author,
                score: item.score,
                selftext: item.selftext || '',
                subreddit: item.subreddit,
                created_utc: item.created_utc,
                thumbnail: item.thumbnail,
                top_comments: topComments
            });
        }

        return trends;
    } catch (error) {
        console.error('Error in fetchTopTrends:', error.message);
        throw error;
    }
}

module.exports = { fetchTopTrends };
