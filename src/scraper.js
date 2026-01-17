const axios = require('axios');
require('dotenv').config();

/**
 * Fetches top trending posts from Reddit directly using JSON endpoints (Bypassing Apify).
 * @returns {Promise<Array>} Array of post objects
 */
async function fetchTopTrends() {
    try {
        const subreddits = ['economics', 'finance', 'investing', 'StockMarket', 'business'];
        let allItems = [];

        console.log('Fetching top trends directly from Reddit JSON...');

        for (const sub of subreddits) {
            try {
                const response = await axios.get(`https://www.reddit.com/r/${sub}/hot/.json?limit=15`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RedditTrendsScraper/1.0' }
                });
                if (response.data && response.data.data && response.data.data.children) {
                    allItems = allItems.concat(response.data.data.children.map(c => c.data));
                }
            } catch (err) {
                console.error(`Error fetching r/${sub}:`, err.message);
            }
        }

        const MAX_AGE_MS = 48 * 60 * 60 * 1000;
        const now = Date.now();

        // 1. Initial Filter
        const candidates = allItems
            .filter(item => {
                const content = item.selftext || item.body || '';
                const title = item.title || '';
                if (!title) return false;
                if (!content || content.trim().length < 20) return false; // More strict on content length

                const createdTime = item.created_utc * 1000;
                if (now - createdTime > MAX_AGE_MS) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

        console.log(`Found ${candidates.length} valid candidates. Fetching comments...`);

        // 2. Fetch Comments for each candidate
        const trends = [];
        for (const item of candidates) {
            let topComments = [];
            try {
                // Reddit comments endpoint returns an array where [0] is the post and [1] is the comment listing
                const commResponse = await axios.get(`https://www.reddit.com/comments/${item.id}.json?limit=15`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RedditTrendsScraper/1.0' }
                });

                if (commResponse.data && commResponse.data[1] && commResponse.data[1].data.children) {
                    topComments = commResponse.data[1].data.children
                        .map(c => c.data)
                        .filter(c => {
                            const body = c.body || '';
                            // Filter serious: length > 30, not just emojis
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
            } catch (err) {
                console.warn(`Could not fetch comments for ${item.id}:`, err.message);
            }

            trends.push({
                id: item.id,
                title: item.title,
                url: `https://www.reddit.com${item.permalink}`,
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
