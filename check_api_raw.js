const https = require('https');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("GOOGLE_API_KEY is missing in .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Checking available models via raw API...`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else if (json.models) {
                const fs = require('fs');
                const validModels = [];
                console.log("✅ Available Generation Models:");
                json.models.forEach(m => {
                    if (m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`  - ${m.name}`);
                        validModels.push(m.name);
                    }
                });
                fs.writeFileSync('valid_models.txt', validModels.join('\n'));
            } else {
                console.log("Unexpected response:", json);
            }
        } catch (e) {
            console.error("Error parsing response:", e.message);
            console.log("Raw response:", data);
        }
    });

}).on('error', (err) => {
    console.error("Network Error:", err.message);
});
