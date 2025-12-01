import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";      // Added for sitemap + future image uploads
import "firebase/compat/analytics";

// Your code here

// Your Firebase config (keep as-is)
const firebaseConfig = {
  apiKey: "AIzaSyBfCLdEs3srUp-Gt7ctNiGFX5czdxDizu4",
  authDomain: "lumina-blog-c92d8.firebaseapp.com",
  projectId: "lumina-blog-c92d8",
  storageBucket: "lumina-blog-c92d8.firebasestorage.app",
  messagingSenderId: "888597428624",
  appId: "1:888597428624:web:ef11dbf874be54ba5bdb15",
  measurementId: "G-XG73Y1PC2X"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export all services
export const app = firebase.app();
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();           // Critical for sitemap.xml upload
export const analytics = firebase.analytics?.();     // Optional chaining in case analytics is disabled
export const googleProvider = new firebase.auth.GoogleAuthProvider();

export default app;