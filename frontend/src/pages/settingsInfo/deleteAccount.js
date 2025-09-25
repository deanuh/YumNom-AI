import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "../../styles/settings.css";

export default function DeleteAccount({ apiBaseUrl = "/api", currentUser }) {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);

  // watch the firebase auth state
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setAuthUser);
  }, []);

  const [showModal, setShowModal] = useState(false);  // to question user if they want to delete
  const [agree, setAgree] = useState(false);    // they click the i understand button
  const [loading, setLoading] = useState(false);  // the delete button is loading after confirmation
  const [errMsg, setErrMsg] = useState("");  // dang it something went wrong

  const userId = useMemo(() => {  // react hook that optimzes performance for caching info
    return currentUser?.uid || authUser?.uid ||null;
  }, [currentUser, authUser]
  );


  const canConfirm = agree;  // the user confirmation - go ahead and delete the account

  async function handleDelete() {
    setErrMsg("");
    if (!userId) {
      setErrMsg("No user is signed in.");  // if this true...how :( 
      return;
    }
    if (!canConfirm) return;
  
    setLoading(true);
    try {
      // WORKS WITH AUTH
      // 1. Get firebase ID token for authorization header
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
  
      // 2. Call backend directly on port 5001  (set it like this bc of earlier problems with backend not responding!!)
      const API_BASE = "http://localhost:5001/api";
      const url = `http://127.0.0.1:5001/api/users/${encodeURIComponent(userId)}`;  // TRY WITHOUT 'API' IN THE URL
  
      const res = await fetch(url, {  // sending delete method to the router for the api and using auth bearer helps with securing user deletion request
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      console.log("DELETE ← status", res.status);  // a check bc it was idle before (backend wasnt responding, this was to make sure it passed thru)
  
      if (!res.ok) {  // failed to delete
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
  
      // 3. clean up local state and redirect - YAY ACCOUNT DELETED
      localStorage.clear();
      navigate("/login", { replace: true });
    } 
    catch (err) {  // waiiit it did not delete... just a try and catch
      setErrMsg(err.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  }
  return (  // what the user sees
    <section className="setting-danger-zone">
      <button className="report-issue-back" onClick={() => navigate(-1)}> ← Back to Settings </button>

      <h2 className="setting-heading">Delete Account</h2>
      <p className="setting-description">
        Permanently remove your account and all related data. This action
        cannot be undone.
      </p>

      <button
        className="setting-btn setting-btn-danger"
        onClick={() => setShowModal(true)}
        disabled={loading}
      >
        Delete my account
      </button>

      {errMsg && <div className="setting-error">{errMsg}</div>}

      {showModal && (
        <div className="setting-modal-backdrop">
          <div className="setting-modal-card">
            <h3 className="setting-modal-title">Confirm account deletion</h3>
            <p className="setting-modal-text">
              This will permanently delete your account and all associated
              data. Please read the statement below and confirm before proceeding.
            </p>

            <label className="setting-checkbox-row">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                I understand that deleting my account is permanent and cannot be undone.
              </span>
            </label>

            {/* <div className="setting-confirm-input">
              <label htmlFor="confirm-delete-input">
                Type <code>DELETE</code> to confirm:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div> */}

            <div className="setting-modal-actions">
              <button
                className="setting-btn setting-btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setAgree(false);
                }}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                className={`setting-btn setting-btn-danger ${
                  !canConfirm ? "setting-btn-disabled" : ""
                }`}
                onClick={handleDelete}
                disabled={!canConfirm || loading}
              >
                {loading ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
