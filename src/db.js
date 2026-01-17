const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let db;

function initDB() {
    try {
        let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.SERVICE_ACCOUNT_PATH;

        // Fallback: Look for serviceAccountKey.json in the project root (one level up from src)
        if (!serviceAccountPath) {
            const defaultPath = path.join(__dirname, '../serviceAccountKey.json');
            // We won't check fs.existsSync here to avoid complex fs imports, 
            // but we will try to resolve it.
            serviceAccountPath = defaultPath;
            console.log(`No env var found. Trying default path: ${serviceAccountPath}`);
        }

        const resolvedPath = path.resolve(serviceAccountPath);
        const serviceAccount = require(resolvedPath);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        db = admin.firestore();
        console.log('Firebase initialized successfully.');
    } catch (error) {
        console.error('CRITICAL: Error initializing Firebase:', error.message);
        db = null; // Ensure db is null so we can check it later
    }
}

/**
 * Checks if a trend ID already exists in the database.
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
async function trendExists(id) {
    if (!db) {
        console.error("DB Not initialized. Cannot check trend existence.");
        throw new Error("DB_NOT_INITIALIZED");
    }
    try {
        const doc = await db.collection('trends').doc(id).get();
        return doc.exists;
    } catch (error) {
        console.error('Error checking trend existence:', error);
        throw error;
    }
}

/**
 * Gets a trend by its ID.
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
async function getTrend(id) {
    if (!db) return null;
    try {
        const doc = await db.collection('trends').doc(id).get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error(`Error fetching trend ${id}:`, error);
        return null;
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

module.exports = { initDB, trendExists, getTrend, saveTrend, getTrendsByDate };
