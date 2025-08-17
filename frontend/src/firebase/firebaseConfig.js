import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";  //changed from database to firestore to connect to actual database
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
   

  // initializing the database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');

export {db, auth};
