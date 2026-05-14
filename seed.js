import { HOSPITAL_DATA } from './src/lib/mockData.js';
import { db } from './src/lib/firebase.js';
import { ref, set } from 'firebase/database';

async function seed() {
  console.log("Seeding hospitals to Firebase...");
  try {
    await set(ref(db, '/hospitals'), HOSPITAL_DATA);
    console.log("Success! Hospitals seeded.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed:", err);
    process.exit(1);
  }
}

seed();
