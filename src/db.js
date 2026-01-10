const admin = require('firebase-admin');
require('dotenv').config();

let db;

function initDB() {
    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
            console.warn('FIREBASE_SERVICE_ACCOUNT_PATH (or SERVICE_ACCOUNT_PATH) not set. Skipping Firebase init.');
            return;
        }

        const serviceAccount = require(require('path').resolve(serviceAccountPath));

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
 * Checks if a trend ID already exists in the database.
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
async function trendExists(id) {
    if (!db) return false;
    try {
        const doc = await db.collection('trends').doc(id).get();
        return doc.exists;
    } catch (error) {
        console.error('Error checking trend existence:', error);
        return false;
    }
}

/**
 * Saves a single trend to Firestore.
 * @param {Object} trend 
 */
async function saveTrend(trend) {
    if (!db) {
        console.log('Database not initialized. Skipping save.');
        return;
    }

    try {
        await db.collection('trends').doc(trend.id).set({
            ...trend,
            savedAt: admin.firestore.FieldValue.serverTimestamp(),
            dateString: new Date().toISOString().split('T')[0] // Helpful for querying by date later
        });
        console.log(`Trend ${trend.id} saved to Firestore.`);
    } catch (error) {
        console.error('Error saving trend to Firestore:', error);
    }
}

/**
 * Retrieves trends from Firestore, optionally filtered or sorted.
 * @returns {Promise<Array>}
 */
async function getTrendsByDate() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('trends')
            .orderBy('savedAt', 'desc')
            .limit(100)
            .get();

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error fetching trends from Firestore:', error);
        return [];
    }
}

module.exports = { initDB, trendExists, saveTrend, getTrendsByDate };
