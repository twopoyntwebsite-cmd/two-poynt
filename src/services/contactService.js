// contact form firestore service

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig, isFirebaseConfigured } from '../firebase.js';

// email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// validate lead capture inputs
export function validateContactSubmission(data) {
    if (!data) {
        return { isValid: false, error: 'Form data is missing.' };
    }

    const name = (data.name || '').trim();
    if (!name || name.length < 2) {
        return { isValid: false, error: 'Please enter your full name (at least 2 characters).' };
    }

    const email = (data.email || '').trim();
    if (email && !EMAIL_REGEX.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address (e.g., name@domain.com).' };
    }

    const phone = (data.phone || '').trim();
    if (!phone) {
        return { isValid: false, error: 'Please enter your contact phone number.' };
    }
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        return { isValid: false, error: 'Please enter a valid contact number (7 to 15 digits).' };
    }

    return { isValid: true };
}

// submit lead via firestore rest api
async function submitViaRest(formData) {
    const projectId = firebaseConfig.projectId || 'backend-two-poynt';
    const apiKey = firebaseConfig.apiKey || 'AIzaSyAJi9LfrDF1Sbgab22kvSOq-QAoXD5-ca0';

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/contact_submissions?key=${apiKey}`;

    const fields = {
        name: { stringValue: formData.name.trim() },
        email: { stringValue: formData.email.trim().toLowerCase() },
        phone: { stringValue: formData.phone.trim() },
        subject: { stringValue: (formData.subject && formData.subject.trim()) || 'Personalised Property Advisory Request' },
        message: { stringValue: (formData.message && formData.message.trim()) || '' },
        status: { stringValue: 'new' },
        createdAt: { timestampValue: new Date().toISOString() }
    };

    if (formData.preferredTimings && formData.preferredTimings.trim()) {
        fields.preferredTimings = { stringValue: formData.preferredTimings.trim() };
    }
    if (formData.location && formData.location.trim()) {
        fields.location = { stringValue: formData.location.trim() };
    }
    if (formData.propertyType && formData.propertyType.trim()) {
        fields.propertyType = { stringValue: formData.propertyType.trim() };
    }
    if (formData.budget && formData.budget.trim()) {
        fields.budget = { stringValue: formData.budget.trim() };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            const errInfo = data.error || {};
            const code = errInfo.code || response.status;
            const message = errInfo.message || '';

            if (code === 404 || message.includes('does not exist') || errInfo.status === 'NOT_FOUND') {
                return {
                    success: false,
                    error: 'Cloud Firestore Database has not been created yet. In your Firebase Console, click "Build" -> "Firestore Database" -> "Create Database".'
                };
            }
            if (code === 403 || message.includes('permission') || errInfo.status === 'PERMISSION_DENIED') {
                return {
                    success: false,
                    error: 'Submission blocked by security rules. In Firebase Console -> Firestore Database -> Rules, set: allow create: if true; and click Publish.'
                };
            }
            return {
                success: false,
                error: message || `Firestore returned HTTP status ${response.status}.`
            };
        }

        const docId = data.name ? data.name.split('/').pop() : 'doc_' + Date.now();
        return {
            success: true,
            id: docId
        };
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return {
                success: false,
                error: 'Submission timed out. Please check your network connection or Firebase Console database status.'
            };
        }
        throw err;
    }
}

// submit contact lead to firestore
export async function submitContactForm(formData) {
    // validate inputs
    const validation = validateContactSubmission(formData);
    if (!validation.isValid) {
        return { success: false, error: validation.error };
    }

    // check credentials
    if (!isFirebaseConfigured()) {
        console.warn('[Firebase] Credentials not configured.');
        return {
            success: false,
            error: 'Firebase is not yet configured. Please add your Firebase credentials in the .env file.'
        };
    }

    // try rest api first
    try {
        const restResult = await submitViaRest(formData);
        if (restResult.success || (restResult.error && (restResult.error.includes('Firebase Console') || restResult.error.includes('security rules')))) {
            return restResult;
        }
    } catch (restErr) {
        console.warn('[Firebase] REST submission error, falling back to SDK:', restErr.message);
    }

    // fallback to sdk
    if (!db) {
        return {
            success: false,
            error: 'Unable to initialize Cloud Firestore client.'
        };
    }

    try {
        const submissionDocument = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            subject: (formData.subject && formData.subject.trim()) || 'Personalised Property Advisory Request',
            message: (formData.message && formData.message.trim()) || '',
            createdAt: serverTimestamp(),
            status: 'new'
        };

        if (formData.preferredTimings && formData.preferredTimings.trim()) {
            submissionDocument.preferredTimings = formData.preferredTimings.trim();
        }
        if (formData.location && formData.location.trim()) {
            submissionDocument.location = formData.location.trim();
        }
        if (formData.propertyType && formData.propertyType.trim()) {
            submissionDocument.propertyType = formData.propertyType.trim();
        }
        if (formData.budget && formData.budget.trim()) {
            submissionDocument.budget = formData.budget.trim();
        }

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 7000)
        );

        const submissionsRef = collection(db, 'contact_submissions');
        const docRef = await Promise.race([
            addDoc(submissionsRef, submissionDocument),
            timeoutPromise
        ]);

        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        console.error('[Firebase] Firestore submission error:', error);

        if (error.message === 'REQUEST_TIMEOUT') {
            return {
                success: false,
                error: 'Submission timed out. Please ensure your Firestore Database is created in Firebase Console (Build -> Firestore Database -> Create database).'
            };
        }

        let friendlyMessage = 'Unable to send your request. Please check your connection and try again.';
        if (error.code === 'permission-denied') {
            friendlyMessage = 'Submission blocked by security rules. In Firebase Console -> Firestore Database -> Rules, set: allow create: if true; and click Publish.';
        } else if (error.code === 'not-found' || (error.message && (error.message.includes('not exist') || error.message.includes('NOT_FOUND')))) {
            friendlyMessage = 'Cloud Firestore Database has not been created yet. In your Firebase Console, click "Build" -> "Firestore Database" -> "Create Database".';
        } else if (error.code === 'unavailable') {
            friendlyMessage = 'Firestore service temporarily unavailable. Please try again shortly.';
        } else if (error.message) {
            friendlyMessage = `Submission notice: ${error.message}`;
        }

        return {
            success: false,
            error: friendlyMessage
        };
    }
}

export default {
    validateContactSubmission,
    submitContactForm
};
