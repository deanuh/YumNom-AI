import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function WriteUser() {
  const [user, setUser] = useState({
    name: "",
    email: ""
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        name: user.name,
        email: user.email,
        createdAt: new Date().toISOString()
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
        name="name"
        placeholder="Name"
        value={user.name}
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
