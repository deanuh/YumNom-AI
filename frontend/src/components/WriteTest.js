import React, { useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, set } from "firebase/database";

function WriteTest() {
  const [input, setInput] = useState("");

  const handleWrite = () => {
    if (!input) return;

    set(ref(database, "test/entry"), { // the test/entry is the collection name in the database
      value: input,  // the value being inputed into the database
      timestamp: new Date().toISOString(),
    })
      .then(() => {
        alert("Data written successfully!");
      })
      .catch((error) => {
        alert("Failed to write data.");
        console.error(error);
      });
  };
  // going to handle reading from the database
  

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Firebase Write Test</h2>
      <input
        type="text"
        placeholder="Enter a dish name"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ marginRight: "1rem" }}
      />
      <button onClick={handleWrite}>Submit</button>
    </div>
  );
}

export default WriteTest;
