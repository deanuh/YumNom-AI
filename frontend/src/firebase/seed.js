import { db } from "./firebaseConfig.js"
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

async function seed() {


    const userRefOne = await addDoc(collection(db, "User"), {
        address: "next to martin",
        date_created: serverTimestamp(),
        first_name: "da",
        last_name: "homie",
        profile_picture: "yumnomai.com/link/to/img.jpg",
        restriction:  [
        {allergen_type: "allergen", name: "alpha-gal syndrome", restriction_id:"https://www.api.com/path/to/id"},
        ],
        username: "martinisilver"
    });

    const userRefTwo = await addDoc(collection(db, "User"), {
        address: "address",
        date_created: serverTimestamp(),
        first_name: "martin",
        last_name: "silva",
        profile_picture: "yumnomai.com/link/to/img.jpg",
        restriction: [],
        username: "dahomie123"
    });

    const groupRef = await addDoc(collection(db, "Group"), {
        date_created: serverTimestamp(),
        members: [ 
        { profile_picture: "yumnomai.com/link/to/img.jpg", user_id: userRefOne, username: "martinisilver"},
        { profile_picture: "yumnomai.com/link/to/img.jpg", user_id: userRefTwo, username: "dahomie123" },
        ],
        owner_id: userRefTwo,
        session_expires_at: Timestamp.fromDate(new Date("2025-09-27T12:00:00Z")) 
    });       

    await addDoc(collection(groupRef, "votes"), {
        added_at: serverTimestamp(),
        name: "Burger King",
        photo_url: "yumnomai.com/link/to/img.jpg",
        recommended_by: userRefOne.id,
        restaurant_id: "https://www.api.com/path/to/id",
        vote_total: 2,
        voted_by: [ userRefOne.id, userRefTwo.id ] 
    });
    await addDoc(collection(userRefOne, "ai_recommended_dishes"), {
        api_id: "https://www.api.com/path/to/id",
        name: "Big Mac",
        photo_url: "yumnomai.com/link/to/img.jpg"
    });

    await addDoc(collection(userRefTwo, "ai_recommended_dishes"), {
        api_id: "https://www.api.com/path/to/id",
        name: "Big Mac",
        photo_url: "yumnomai.com/link/to/img.jpg"
    });

    await addDoc(collection(userRefOne, "favorites"), {
        api_id: "https://www.api.com/path/to/id",
        name: "Whopper",
        photo_url: "yumnomai.com/link/to/img.jpg",
        type: "dish"
    });
    await addDoc(collection(userRefOne, "favorites"), {
        api_id: "https://www.api.com/path/to/id",
        name: "Burger King",
        photo_url: "yumnomai.com/link/to/img.jpg",
        type: "restaurant"
    });

}

export { seed };
