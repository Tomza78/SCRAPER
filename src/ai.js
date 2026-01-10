const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Global model instance
// available keys: gemini-3-flash-preview, gemini-2.0-flash
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

/**
 * Summarizes the post content into Hebrew.
 */
async function summarizePost(title, content) {
    const prompt = `
    Analyze the following Reddit post and provide a concise summary in Hebrew (2-3 sentences).
    Title: ${title}
    Content: ${content || "No content provided (Link/Image post)"}
    
    Summary in Hebrew:
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error(`Summarize Error (${error.message})`);
        return "תקציר לא זמין (שגיאת AI)";
    }
}

/**
 * Categorizes the post and checks if it is Finance related.
 * Returns the category name in Hebrew if relevant, or NULL/FALSE if not related.
 * @param {string} title 
 * @returns {Promise<string|null>} Category name or null
 */
async function categorizePost(title) {
    const prompt = `
    Analyze this Reddit post title and determine if it belongs to one of these categories:
    1. Economy (כלכלה)
    2. Finance (פיננסים)
    3. Investing (השקעות)
    4. Business (עסקים)
    
    If it belongs to one of these, return the Hebrew Category Name.
    If it is NOT related to finance/economy (e.g. politics, sports, memes, general news), return "SKIP".
    
    Title: ${title}
    
    Response (Category Name or SKIP):
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text.includes("SKIP") || text.includes("לא רלוונטי")) return null;
        return text;
    } catch (error) {
        console.error(`Categorize Error (${error.message})`);
        // Fallback
        return "כללי";
    }
}

/**
 * Summarizes the top comments into a concise Hebrew "Discussion Summary".
 * Now deepened to capture up to 6 distinct opinions/points.
 * @param {Array} comments 
 * @returns {Promise<string>}
 */
async function summarizeComments(comments) {
    if (!comments || comments.length === 0) return "אין תגובות משמעותיות למיזם זה.";

    // Sort by score if available, or just take top 10 for analysis
    const bestComments = comments.slice(0, 10);
    const commentsText = bestComments.map((c, i) => `Comment ${i + 1}: ${c.body}`).join("\n");

    const prompt = `
    Analyze the following top comments from a Reddit thread.
    Provide a comprehensive summary in Hebrew that captures at least 6 distinct opinions, points, or unique community sentiments expressed.
    Use bullet points in Hebrew for the opinions.
    
    Comments:
    ${commentsText}
    
    Discussion Summary in Hebrew (with 6 bullet points):
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error(`Summarize Comments Error (${error.message})`);
        return "סיכום תגובות לא זמין כרגע.";
    }
}

module.exports = { summarizePost, categorizePost, summarizeComments };
