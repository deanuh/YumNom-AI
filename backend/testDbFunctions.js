// run using node testDbFunctions.js
import "dotenv/config";
import {
  addUser,
  deleteUser,
  addGroup,
  deleteGroup,
  addFavorite,
  deleteFavorite,
  addRecommendation,
  deleteRecommendation,
  addVote,
  deleteVote
} from "./src/firebase/dbFunctions.js";

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, (s*1000)));
}

async function runTests() {
  console.log("=== Starting Firestore DB Function Tests ===");

  let userId, groupId, favoriteId, recommendationId, voteId;

  try {
    // 1. Add a user
    console.log("\n1. Adding User...");
    userId = await addUser({first_name: "MARTIN", last_name: "SILVA", username: "MARTINSILVA1234"});
    console.log(`User created with ID: ${userId}`);
		await sleep(10);

    // 2. Add a group for the user
    console.log("\n2. Adding Group...");
    groupId = await addGroup(userId);
    console.log(`Group created with ID: ${groupId}`);
		await sleep(10);

    // 3. Add a favorite for the user
    console.log("\n3. Adding Favorite...");
    favoriteId = await addFavorite(userId, {api_id: "API_ID", name: "chicken nuggets", photo_url: "img.com", type: "dish"});
    console.log(`Favorite added with ID: ${favoriteId}`);
		await sleep(10);

    // 4. Add a recommendation for the user
    console.log("\n4. Adding Recommendation...");
    recommendationId = await addRecommendation(userId, {api_id: "API_ID", name: "burger", photo_url: "img.com"});
    console.log(`Recommendation added with ID: ${recommendationId}`);
		await sleep(10);

    // 5. Add a vote for the group
    console.log("\n5. Adding Vote...");
    voteId = await addVote(groupId, userId, {name:"burger king", photo_url: "img.com", restaurant_id: "RESTAURANT_ID"});
    console.log(`Vote added with ID: ${voteId}`);
		await sleep(10);

    // Log current state
    console.log("\nAll operations completed successfully. Starting cleanup...");

    // 6. Delete vote
    console.log("\n6. Deleting Vote...");
    await deleteVote(groupId, voteId);
    console.log("Vote deleted");
		await sleep(10);

    // 7. Delete recommendation
    console.log("\n7. Deleting Recommendation...");
    await deleteRecommendation(userId, recommendationId);
    console.log("Recommendation deleted");
		await sleep(10);

    // 8. Delete favorite
    console.log("\n8. Deleting Favorite...");
    await deleteFavorite(userId, favoriteId);
    console.log("Favorite deleted");
		await sleep(10);

    // 9. Delete group
    console.log("\n9. Deleting Group...");
    await deleteGroup(groupId);
    console.log("Group deleted");
		await sleep(10);

    // 10. Delete user
    console.log("\n10. Deleting User...");
    await deleteUser(userId);
    console.log("User deleted");
		await sleep(10);

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error(`\nTest failed: ${error.message}`);
  }
}

runTests();

