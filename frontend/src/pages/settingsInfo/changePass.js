// this file will be for the user to update their password
// need to have auth0 started -> this will allow the user to update password thru firebase auth0

// src/pages/ChangePassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
// Make sure this points to your initialized auth instance
import { auth } from "../../firebase/firebaseConfig"; // e.g., export const auth = getAuth(app)

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return setMsg({ type: "error", text: "Please fill out all fields." });
    }
    if (newPassword !== confirmNewPassword) {
      return setMsg({ type: "error", text: "New passwords do not match." });
    }
    if (newPassword.length < 6) {
      return setMsg({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
    }
    if (currentPassword === newPassword) {
      return setMsg({
        type: "error",
        text: "New password must be different from your current password.",
      });
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      return setMsg({
        type: "error",
        text: "No authenticated user found. Please sign in again.",
      });
    }

    setLoading(true);
    try {
      // Re-auth with current password
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);

      // Update to new password
      await updatePassword(user, newPassword);

      setMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      let friendly = "Something went wrong. Please try again.";
      if (err.code === "auth/wrong-password") friendly = "Current password is incorrect.";
      if (err.code === "auth/weak-password") friendly = "New password is too weak.";
      if (err.code === "auth/too-many-requests")
        friendly = "Too many attempts. Please wait a bit, then try again.";
      if (err.code === "auth/requires-recent-login")
        friendly = "For security, please sign in again and retry.";
      setMsg({ type: "error", text: friendly });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Set-settings-body">
      <button className="report-issue-back" onClick={() => navigate(-1)}> ← Back to Settings </button>

      <div className="Set-settings-card">

        <h2 className="Set-settings-title">Security</h2>

        <section className="Set-settings-section">
          <h3 className="Set-section-heading">Change Password</h3>

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
              <label className="report-issue-label" htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                className="lp-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="report-issue-field">
              <label className="report-issue-label" htmlFor="confirmNewPassword">
                Confirm new password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                className="lp-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {msg.text ? (
              <div
                className={`report-issue-status ${
                  msg.type === "error" ? "error" : "success"
                }`}
                role="alert"
                style={{ marginTop: "0.5rem" }}
              >
                {msg.text}
              </div>
            ) : null}

            <div className="report-issue-actions">
              <button
                className="report-issue-btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
              {/* Optional cancel/back action could use your Set-back-button style */}
              {/* <button type="button" className="Set-back-button" onClick={() => navigate(-1)}>Cancel</button> */}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ChangePassword;


// function ChangePassword() {
//     return <div><h3>The page to change user password</h3>
//     <p>Here you will change your pasword</p></div>;
//   }
// export default ChangePassword;
  
