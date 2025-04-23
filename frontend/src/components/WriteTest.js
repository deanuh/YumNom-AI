// imort react and useState to manage form data and the state it is in as we click certain things
import React, { useState } from "react";
import {
  collection, // used to reference the "User" collection
  addDoc,     // to add a document (row) to the collection in Firestore database
  query,      // used for when we build a query to search thru database
  where,      // to add filtering when we searching for something (where user.name == "Ateez")
  getDocs,    // gets the documents based on the filters we looking for ^^
  deleteDoc,  // to delete a specific document
  doc         // to reference a specific document by ID (look @ delete function to see in the works)
} from "firebase/firestore";   
import { db } from "../firebase/firebaseConfig";

function WriteUser() {
  // state to store what we type on the webpage as input values
  const [user, setUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    friends: []  // not used rn (will for later when we add friends list)
  });

  // state to store a user 
  const [foundUser, setFoundUser] = useState(null);

  // updates the user object as input fields change (before adding to the database; like if we misspell name)
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // handles adding a new user to the firestore database
  const handleSubmit = async () => {
    try {
      // adds the user data as a new document in the "User" collection
      const docRef = await addDoc(collection(db, "User"), {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        friends: user.friends,
      });
      alert(`User added with ID: ${docRef.id}`);  // these are alerts that will show on browser just to let us know
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // to find a user by the first/last name and email in the database
  const handleFindUser = async () => {
    try {
      // creating a query that will match what the user hasinputed in the text fields
      const userQuery = query(  //'query' keyword
        collection(db, "User"),  // 'where' keyword for query searches
        where("first_name", "==", user.first_name),
        where("last_name", "==", user.last_name),
        where("email", "==", user.email)
      );
      // the snapshot will get the matching document based off the query
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {  // assumes the first match is the one we are looking for (first result from query)
        const userDoc = querySnapshot.docs[0];
        setFoundUser({ id: userDoc.id, ...userDoc.data() });  // get the ID of the document
        alert(`User found: ${userDoc.id}`);
      } else {
        setFoundUser(null);  // there is no user that matches the fields
        alert("No user found.");
      }
    } catch (e) {
      console.error("Error finding user: ", e);  // didnt work
    }
  };

  // now we try deleting from the collection (by deleting a user)
  // const handleDeleteUser = async () => {
  //   if (!foundUser) {
  //     alert("No user selected for deletion.");
  //     return;
  //   }

  //   try {
  //     await deleteDoc(doc(db, "User", foundUser.id));
  //     alert(`User with ID ${foundUser.id} deleted.`);
  //     setFoundUser(null);
  //   } catch (e) {
  //     console.error("Error deleting user: ", e);
  //   }
  // };
  // Handles deleting a user based on current input field values

  // now we try deleting from the collection (by deleting a user)
  // this one will work without having to click on 'find user' first - based on the text fields on the page
const handleDeleteUser = async () => {
  try {
    const userQuery = query( // the query will read off the text input fields from 
      collection(db, "User"),
      where("first_name", "==", user.first_name),
      where("last_name", "==", user.last_name),
      where("email", "==", user.email)
    );

    const querySnapshot = await getDocs(userQuery);  // get the document matching the inputs

    if (!querySnapshot.empty) {  // first result
      const userDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, "User", userDoc.id));
      alert(`User with ID ${userDoc.id} deleted.`);
    } else {
      alert("No user found to delete.");
    }
  } catch (e) {
    console.error("Error deleting user: ", e);
  }
};


  return (
    <div style={{ padding: "2rem" , color: "#190352"}}>
      <h2>User Management</h2>
      <input
        name="first_name"
        placeholder="First Name"
        value={user.first_name}
        onChange={handleChange}
        style={{ marginRight: "1rem" }}
      />
      <input
        name="last_name"
        placeholder="Last Name"
        value={user.last_name}
        onChange={handleChange}
        style={{ marginRight: "1rem" }}
      />
      <input
        name="email"
        placeholder="Email"
        value={user.email}
        onChange={handleChange}
        style={{ marginRight: "1rem" }}
      />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleSubmit}>Add User</button>
        <button onClick={handleFindUser} style={{ marginLeft: "1rem" }}>Find User</button>
        <button onClick={handleDeleteUser} style={{ marginLeft: "1rem" }}>Delete User</button>
      </div>
      {foundUser && (
        <div style={{ marginTop: "1rem", color: "green" }}>
          <strong>Found User:</strong> {foundUser.first_name} {foundUser.last_name} ({foundUser.email})
        </div>
      )}
    </div>
  );
}

export default WriteUser;

