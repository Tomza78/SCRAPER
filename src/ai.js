const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Summarizes the post content into Hebrew.
 * @param {string} title 
 * @param {string} content 
 * @returns {Promise<string>} Hebrew summary
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
        console.error("Error summarizing post:", error);
        return "סיכום לא זמין.";
    }
}

/**
 * Categorizes the post into a general category.
 * @param {string} title 
 * @returns {Promise<string>} Category name (Hebrew/English mixed common terms is fine, user asked for 'Finance, Lifestyle etc')
 */
async function categorizePost(title) {
    const prompt = `
    Categorize this Reddit post title into one of the following categories: Finance, Lifestyle, Tech, News, Entertainment, Sports, Politics, Other.
    Return ONLY the category name in Hebrew.
    Title: ${title}
    
    Category:
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Error categorizing post:", error);
        return "כללי";
    }
}

/**
 * Translates the full content to Hebrew.
 * @param {string} text 
 * @returns {Promise<string>} Hebrew translation
 */
async function translateContent(text) {
    if (!text) return "אין תוכן לתרגום.";

    const prompt = `
    Translate the following text to Hebrew. Maintain the tone and formatting.
    Text:
    ${text}
    
    Hebrew Translation:
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Error translating content:", error);
        return "שגיאה בתרגום.";
    }
}

module.exports = { summarizePost, categorizePost, translateContent };
