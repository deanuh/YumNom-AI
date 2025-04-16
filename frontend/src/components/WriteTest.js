import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function WriteUser() {
  const [user, setUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    friends: [] // optionally pre-fill or leave empty
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const docRef = await addDoc(collection(db, "User"), {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        friends: user.friends,
      });
      alert(`User added with ID: ${docRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Add User to Firestore</h2>
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
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default WriteUser;
