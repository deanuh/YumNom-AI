require("dotenv").config({path: "../../.env"});

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const useEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

if (useEmulator) {
  console.log(`Using Firestore Emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

const db = admin.firestore();

module.exports = { db };

