const admin = require('firebase-admin');
require('dotenv').config();

let db;

function initDB() {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set. Skipping Firebase init.');
            return;
        }

        const serviceAccount = require(require('path').resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        db = admin.firestore();
        console.log('Firebase initialized successfully.');
    } catch (error) {
        console.warn('Error initializing Firebase (check credentials):', error.message);
    }
}

/**
 * Saves the daily trends to Firestore.
 * @param {Array} trends 
 */
async function saveTrends(trends) {
    if (!db) {
        console.log('Database not initialized. Skipping save.');
        return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const docRef = db.collection('daily_trends').doc(today);

    try {
        await docRef.set({
            date: today,
            trends: trends,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Trends for ${today} saved to Firestore.`);
    } catch (error) {
        console.error('Error saving trends to Firestore:', error);
    }
}

module.exports = { initDB, saveTrends };
