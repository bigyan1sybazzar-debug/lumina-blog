// src/services/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth as getAuthModular, GoogleAuthProvider } from "firebase/auth";
import { getFirestore as getFirestoreStd } from "firebase/firestore";
import { getFirestore as getFirestoreLite } from "firebase/firestore/lite";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

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

// ⚡️ Edge Runtime Polyfills
if (typeof window === 'undefined') {
    if (typeof (globalThis as any).navigator === 'undefined') {
        (globalThis as any).navigator = { userAgent: 'node.js', onLine: true, languages: ['en-US', 'en'] };
    }
    if (typeof (globalThis as any).location === 'undefined') {
        (globalThis as any).location = { protocol: 'https:', host: 'localhost', href: 'https://localhost/' };
    }
}

// Initialize Modular App (Safer for Edge/Lite services)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Compat App (For legacy collection().get() usage)
if (isBrowser && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exports:
export { app };

// Legacy Compat Exports
export const db = isBrowser ? firebase.firestore() : null as any;
export const auth: firebase.auth.Auth = isBrowser ? firebase.auth() : {} as any;
export const googleProvider = isBrowser ? new firebase.auth.GoogleAuthProvider() : null;

// New Modular/Lite Exports
export const dbLite = getFirestoreLite(app);
export const dbModular = isBrowser ? getFirestoreStd(app) : dbLite;

// Cleanup for Edge/Server environments where analytics might be imported
export const analytics = null;

export default app;