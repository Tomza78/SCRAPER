const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    // Hack to access the model listing if not directly exposed, 
    // actually the SDK doesn't always expose listModels on the top level class easily in all versions.
    // But let's try assuming the standard way if possible, or just try generation with 1.5-flash again.
    // The error message suggested: "Call ListModels to see the list..."

    // Let's try to just test the specific expected models again with better logging
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const modelName of models) {
        console.log(`Testing model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`✅ SUCCESS: ${modelName} is available.`);
            // If we found one, we could stop, but let's see all
        } catch (e) {
            console.log(`❌ FAILED: ${modelName} - ${e.message.split('\n')[0]}`);
        }
    }
}

listModels();
