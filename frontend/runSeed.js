import 'dotenv/config';
import { db, auth } from "./src/firebase/firebaseConfig.js";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

import { seed } from "./src/firebase/seed.js";

async function runSeed() {
    console.log("Seeding users...");
    await seed();
    console.log("Seeding complete!");
}

//for development
connectFirestoreEmulator(db, "localhost", 8080);
connectAuthEmulator(auth, "http://localhost:9099");

runSeed().catch(console.error);

