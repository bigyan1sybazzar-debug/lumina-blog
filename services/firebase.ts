// src/services/firebase.ts

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore"; 
import "firebase/compat/analytics";

// ⚠️ IMPORTANT: Helper function to check environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Client-side Firebase config (public-safe)
const firebaseConfig = {
    apiKey: "AIzaSyBfCLdEs3srUp-Gt7ctNiGFX5czdxDizu4",
    authDomain: "lumina-blog-c92d8.firebaseapp.com",
    projectId: "lumina-blog-c92d8",
    storageBucket: "lumina-blog-c92d8.firebasestorage.app",
    messagingSenderId: "888597428624",
    appId: "1:888597428624:web:ef11dbf874be54ba5bdb15",
    measurementId: "G-XG73Y1PC2X"
};

// Initialize once
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exports:
export const app = firebase.app();

// 1. Auth and Google Provider are only initialized if window/document exists
export const auth = isBrowser ? firebase.auth() : {} as firebase.auth.Auth;
export const googleProvider = isBrowser ? new firebase.auth.GoogleAuthProvider() : null;

// 2. Firestore is safe for Node (used for sitemap script)
export const db: firebase.firestore.Firestore = firebase.firestore();

// 3. Analytics is only initialized if supported
// The `?.` (optional chaining) is good, but `isBrowser` is cleaner for initialization
export const analytics: firebase.analytics.Analytics | null = isBrowser ? firebase.analytics() : null;

export default app;