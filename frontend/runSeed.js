import 'dotenv/config';
import { seed } from "./src/firebase/seed.js";

async function runSeed() {
    console.log("Seeding users...");
    await seed();
    console.log("Seeding complete!");
}

runSeed().catch(console.error);

