// frontend/src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";  //changed from database to firestore to connect to actual database
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
 }; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export both Authentication and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to Auth Emulator if running locally
if (window.location.hostname === "localhost") {
    console.log("Development environment: Connecting to Firebase Auth Emulator.");
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
