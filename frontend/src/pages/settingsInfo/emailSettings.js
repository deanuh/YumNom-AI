// for user to update the email? idk how this would really work
// src/pages/ChangeEmail.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail, // safer flow: email changes after user verifies the link
  // updateEmail,          // alternative immediate change (not recommended without verification)
} from "firebase/auth";
// makes sure this points to your initialized auth instance
import { auth } from "../../firebase/firebaseConfig"; // e.g., export const auth = getAuth(app)

const ChangeEmail = () => {
  const navigate = useNavigate();  // to navigate back to settings page

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Basic checks - user needs to input their current password and then their new email
    if (!currentPassword || !newEmail || !confirmNewEmail) {  // either password wrong or emails wrong
      return setMsg({ type: "error", text: "Please fill out all fields." });
    }
    if (newEmail !== confirmNewEmail) {  // make them match!!
      return setMsg({ type: "error", text: "New emails do not match." });
    }
    if (!validateEmail(newEmail)) {
      return setMsg({ type: "error", text: "Please enter a valid email address." });
    }

    const user = auth.currentUser;  // user needs to be logged in, making sure there the session is open
    if (!user || !user.email) {
      return setMsg({
        type: "error",
        text: "No authenticated user found. Please sign in again.",
      });
    }
    if (user.email.toLowerCase() === newEmail.toLowerCase()) { 
      return setMsg({
        type: "error",
        text: "New email must be different from your current email.",
      });
    }

    setLoading(true);
    try {
      // 1) Re-authenticate with the user's current password
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);

      // 2) Send verification link to the new email (recommended)
      await verifyBeforeUpdateEmail(user, newEmail);

      
      // await updateEmail(user, newEmail);

      // to store user email in Firestore
      // await updateDoc(doc(db, "users", user.uid), { email: newEmail });

      setMsg({
        type: "success",
        text:
          "Verification link sent to your new email. Please click the link to confirm and complete the change.",
      });
      setCurrentPassword("");
      setNewEmail("");
      setConfirmNewEmail("");
    } catch (err) {
      let friendly = "Something went wrong. Please try again.";
      if (err.code === "auth/wrong-password") friendly = "Current password is incorrect.";
      if (err.code === "auth/invalid-email") friendly = "The new email address is invalid.";
      if (err.code === "auth/email-already-in-use")
        friendly = "That email is already in use by another account.";
      if (err.code === "auth/too-many-requests")
        friendly = "Too many attempts. Please wait a bit, then try again.";
      if (err.code === "auth/requires-recent-login")
        friendly = "For security, please sign in again and retry.";
      setMsg({ type: "error", text: friendly });
    } finally {
      setLoading(false);
    }
  };

  return (  // what user sees
    <div className="Set-settings-body">
      <button className="report-issue-back" onClick={() => navigate(-1)}> ← Back to Settings </button>

      <div className="Set-settings-card">
        <h2 className="Set-settings-title">Security</h2>

        <section className="Set-settings-section">
          <h3 className="Set-section-heading">Change Email</h3>
          <form onSubmit={handleSubmit}>
            <div className="report-issue-field">
              <label className="report-issue-label" htmlFor="currentPassword">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                className="lp-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="report-issue-field">
              <label className="report-issue-label" htmlFor="newEmail">
                New email
              </label>
              <input
                id="newEmail"
                type="email"
                className="lp-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="report-issue-field">
              <label className="report-issue-label" htmlFor="confirmNewEmail">
                Confirm new email
              </label>
              <input
                id="confirmNewEmail"
                type="email"
                className="lp-input"
                value={confirmNewEmail}
                onChange={(e) => setConfirmNewEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {msg.text ? (
              <div
                className={`report-issue-status ${msg.type === "error" ? "error" : "success"}`}
                role="alert"
                style={{ marginTop: "0.5rem" }}
              >
                {msg.text}
              </div>
            ) : null}

            <div className="report-issue-actions">
              <button className="report-issue-btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Verification"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ChangeEmail;
