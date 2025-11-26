import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyBfCLdEs3srUp-Gt7ctNiGFX5czdxDizu4",
  authDomain: "lumina-blog-c92d8.firebaseapp.com",
  projectId: "lumina-blog-c92d8",
  storageBucket: "lumina-blog-c92d8.firebasestorage.app",
  messagingSenderId: "888597428624",
  appId: "1:888597428624:web:ef11dbf874be54ba5bdb15",
  measurementId: "G-XG73Y1PC2X"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize and export services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const analytics = firebase.analytics();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

export default firebase.app();