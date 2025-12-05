// services/indexingService.ts
import { google } from 'googleapis';
import path from 'path';

// --- IMPORTANT CONFIGURATION ---

// ⚠️ SECURITY WARNING: This path must be securely managed on your server.
// Adjust 'config' path if your key is stored elsewhere.
const KEY_FILE_PATH = path.join(process.cwd(), 'config', 'google-service-account-key.json'); 
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

// 🔑 IndexNow Key: Replace this placeholder with your actual key.
const INDEXNOW_KEY = '0d1b888a89bd4cc58ed1cd2eeb7658c4'; 
const host = 'bigyann.com.np'; 

// --- GOOGLE INDEXING API ---

/**
 * Submits URLs to the Google Indexing API.
 * NOTE: Only works for pages with JobPosting or BroadcastEvent structured data.
 * @param urls Array of URLs to submit.
 * @param type Type of notification ('URL_UPDATED' or 'URL_DELETED').
 */
export async function submitToGoogleIndexingAPI(urls: string[], type: 'URL_UPDATED' | 'URL_DELETED') {
    if (urls.length === 0) return;

    try {
        // 1. Initialize GoogleAuth, which handles the credentials.
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });

        // 2. CORRECTED: Initialize the Indexing API by passing the 
        // GoogleAuth instance itself as the 'auth' property for type safety.
        const indexing = google.indexing({ version: 'v3', auth: auth });

        for (const url of urls) {
            await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: type
                }
            });
            console.log(`Google Indexing API: Submitted ${type} for ${url}`);
        }

    } catch (err: any) {
        // Detailed error logging is crucial for authentication issues
        console.error("Google Indexing API FAILED:", err.message);
        if (err.errors) {
            console.error("API Errors:", err.errors);
        }
    }
}

// --- INDEXNOW API ---

/**
 * Submits URLs to the IndexNow API (Bing, Yandex, etc.).
 * @param urls Array of URLs to submit.
 */
export async function submitToIndexNow(urls: string[]) {
    if (urls.length === 0) return;
    
    // Ensure the key file exists at https://bigyann.com.np/INDEXNOW_KEY.txt
    const payload = {
        host: host,
        key: INDEXNOW_KEY,
        keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
    };

    try {
        const response = await fetch("https://api.indexnow.org/IndexNow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (response.status === 200) {
            console.log(`IndexNow Submission SUCCESS for ${urls.length} URLs.`);
        } else {
            console.error(`IndexNow Submission FAILED: HTTP Status ${response.status}`);
            const errorBody = await response.text();
            console.error("IndexNow Error Body:", errorBody);
        }
    } catch (error) {
        console.error("IndexNow Network Error:", error);
    }
}