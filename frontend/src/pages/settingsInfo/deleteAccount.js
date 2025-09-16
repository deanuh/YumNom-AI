import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { getAuth } from "firebase/auth"; // if using Firebase auth
import "../../styles/settings.css";

export default function DeleteAccount({ apiBaseUrl = "/api", currentUser }) {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const userId = useMemo(() => {
    if (currentUser?.uid) return currentUser.uid;
    // const auth = getAuth();
    // return auth.currentUser?.uid || null;
    return null;
  }, [currentUser]);

  const canConfirm = agree && confirmText.trim().toUpperCase() === "DELETE";

  async function handleDelete() {
    setErrMsg("");
    if (!userId) {
      setErrMsg("No user is signed in.");
      return;
    }
    if (!canConfirm) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }

      // Clean up local state and redirect
      localStorage.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      setErrMsg(err.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
              data. Please confirm you understand before proceeding.
            </p>

            <label className="setting-checkbox-row">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                I understand this action is permanent and cannot be undone.
              </span>
            </label>

            <div className="setting-confirm-input">
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
            </div>

            <div className="setting-modal-actions">
              <button
                className="setting-btn setting-btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
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
