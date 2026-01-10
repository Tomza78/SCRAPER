const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function main() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        // For gemini, we can't easily "list" models with the simple client sometimes, 
        // but let's try a direct simple generation with a fallback model to see if ANYTHING works.
        // Actually, the new SDK might not have a listModels method exposed easily on the instance?
        // Let's try to just run a simple prompt with 'gemini-pro' and 'gemini-1.5-flash' and print specific error.

        console.log("Testing gemini-1.5-flash...");
        const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model1.generateContent("Hello");
        console.log("SUCCESS: gemini-1.5-flash works!");

        console.log("\nTesting gemini-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model2.generateContent("Hello");
        console.log("SUCCESS: gemini-pro works!");

    } catch (error) {
        console.error("Test failed:");
        console.error(error.message);
        if (error.response) {
            console.error("Response details:", error.response);
        }
    }
}

main();
