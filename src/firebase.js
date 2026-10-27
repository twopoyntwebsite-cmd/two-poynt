// firebase client init

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

// read environment variable
function getEnv(key) {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
            return import.meta.env[key];
        }
    } catch (_) {
        // non-vite fallback
    }

    if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key] !== undefined) {
        return window.__ENV__[key];
    }

    return '';
}

export const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyAJi9LfrDF1Sbgab22kvSOq-QAoXD5-ca0',
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'backend-two-poynt.firebaseapp.com',
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'backend-two-poynt',
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'backend-two-poynt.firebasestorage.app',
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '931470567610',
    appId: getEnv('VITE_FIREBASE_APP_ID') || '1:931470567610:web:c01cdadfb1ad24f70d3a83'
};

// verify credentials are set
export function isFirebaseConfigured() {
    const { apiKey, projectId } = firebaseConfig;
    return Boolean(
        apiKey &&
        apiKey.trim() !== '' &&
        apiKey !== 'your_firebase_api_key' &&
        projectId &&
        projectId.trim() !== '' &&
        projectId !== 'your_project_id'
    );
}

// init firebase app and firestore
let appInstance = null;
let dbInstance = null;

try {
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    try {
        dbInstance = initializeFirestore(appInstance, {
            experimentalForceLongPolling: true,
            useFetchStreams: false
        });
    } catch (_) {
        dbInstance = getFirestore(appInstance);
    }
} catch (error) {
    console.warn('[Firebase] Initialization notice:', error.message);
}

export const app = appInstance;
export const db = dbInstance;

export default {
    app,
    db,
    firebaseConfig,
    isFirebaseConfigured
};
