// this file will be for the user to update their password
// need to have auth0 started -> this will allow the user to update password thru firebase auth0


//import React, { useState } from "react";
// import { updatePassword } from "firebase/auth";
// import { auth } from "../../firebase/firebaseConfig"; //need to export auth from here (add to the .env if key is needed)
// function ChangePassword() {
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [message, setMessage] = useState("");
  
//     const handlePasswordUpdate = async () => {
//       if (!auth.currentUser) {
//         setMessage("⚠️ No user is currently logged in.");
//         return;
//       }
  
//       if (newPassword !== confirmPassword) {
//         setMessage("Passwords do not match.");
//         return;
//       }
  
//       try {
//         await updatePassword(auth.currentUser, newPassword);
//         setMessage("Password updated successfully.");
//         setNewPassword("");
//         setConfirmPassword("");
//       } catch (error) {
//         console.error("Error updating password:", error.message);
//         if (error.code === "auth/requires-recent-login") {
//           setMessage("⚠️ Please re-authenticate to change your password.");
//         } else {
//           setMessage(`Failed to update password: ${error.message}`);
//         }
//       }
//     };
  
//     return (
//       <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
//         <h2>Change Your Password</h2>
  
//         <input
//           type="password"
//           placeholder="New Password"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           style={{ display: "block", marginBottom: "1rem", width: "100%" }}
//         />
  
//         <input
//           type="password"
//           placeholder="Confirm New Password"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//           style={{ display: "block", marginBottom: "1rem", width: "100%" }}
//         />
  
//         <button onClick={handlePasswordUpdate}>Update Password</button>
//         {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
//       </div>
//     );
//   }
  
//   export default ChangePassword;


// place holder

function ChangePassword() {
    return <div><h3>The page to change user password</h3>
    <p>Here you will change your pasword</p></div>;
  }
export default ChangePassword;
  
