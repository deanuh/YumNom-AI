import dbModule from "./db.cjs"; 
const { db } = dbModule;
import admin from "firebase-admin";

const { FieldValue, Timestamp } = admin.firestore;

async function seed() {
  try {
    // -------------------- USERS -------------------- //
    const userRefOne = await db.collection("User").add({
      address: "next to martin",
      date_created: FieldValue.serverTimestamp(),
      first_name: "da",
      last_name: "homie",
      profile_picture: "yumnomai.com/link/to/img.jpg",
      restriction: {
        "https://www.api.com/path/to/id": { allergen_type: "allergen", name: "alpha-gal syndrome" },
      },
      username: "martinisilver",
			current_group: null
    });

    const userRefTwo = await db.collection("User").add({
      address: "address",
      date_created: FieldValue.serverTimestamp(),
      first_name: "martin",
      last_name: "silva",
      profile_picture: "yumnomai.com/link/to/img.jpg",
      restriction: {},
      username: "dahomie123",
			current_group: null
    });

    // -------------------- GROUP -------------------- //
    const groupRef = await db.collection("Group").add({
      date_created: FieldValue.serverTimestamp(),
      members: {
        [userRefOne.id]: { profile_picture: "yumnomai.com/link/to/img.jpg", username: "martinisilver" },
        [userRefTwo.id]: { profile_picture: "yumnomai.com/link/to/img.jpg", username: "dahomie123" },
      },
      owner_id: userRefTwo.id,
      session_expires_at: Timestamp.fromDate(new Date("2025-09-27T12:00:00Z")),
    });

		await userRefOne.update({
				current_group: groupRef.id
		});

		await userRefTwo.update({
				current_group: groupRef.id
		});
    // -------------------- VOTES -------------------- //
    await db.collection("Group").doc(groupRef.id).collection("votes").add({
      added_at: FieldValue.serverTimestamp(),
      name: "Burger King",
      photo_url: "yumnomai.com/link/to/img.jpg",
      recommended_by: userRefOne.id,
      restaurant_id: "https://www.api.com/path/to/id",
      vote_total: 2,
      voted_by: [userRefOne.id, userRefTwo.id],
    });

    // -------------------- AI RECOMMENDED DISHES -------------------- //
    await db.collection("User").doc(userRefOne.id).collection("ai_recommended_dishes").add({
      api_id: "https://www.api.com/path/to/id",
      name: "Big Mac",
      photo_url: "yumnomai.com/link/to/img.jpg",
    });

    await db.collection("User").doc(userRefTwo.id).collection("ai_recommended_dishes").add({
      api_id: "https://www.api.com/path/to/id",
      name: "Big Mac",
      photo_url: "yumnomai.com/link/to/img.jpg",
    });

    // -------------------- FAVORITES -------------------- //
    const favoritesData = [
      { api_id: "https://www.api.com/path/to/id", name: "Whopper", photo_url: "yumnomai.com/link/to/img.jpg", type: "dish" },
      { api_id: "https://www.api.com/path/to/id", name: "Burger King", photo_url: "yumnomai.com/link/to/img.jpg", type: "restaurant" },
    ];

    for (const fav of favoritesData) {
      await db.collection("User").doc(userRefOne.id).collection("favorites").add(fav);
      await db.collection("User").doc(userRefTwo.id).collection("favorites").add(fav);
    }

    console.log("Firestore seeded successfully!");
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}

// Run the seed script when executed directly
if (import.meta.url === `file://${process.argv[1]}` && process.env.FIRESTORE_EMULATOR_HOST) {
  seed().then(() => process.exit(0));
}

export { seed };
