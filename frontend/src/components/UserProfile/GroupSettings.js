// src/components/UserProfile/GroupSettings.js
import React, { useEffect, useMemo, useState } from "react";
import "../../styles/UserProfile.css";
import {
  lookupUserByUsername,
  fetchMyFriends,
  addFriendById,
  removeFriend,
} from "../../userapi/friendsApi";

const DEFAULT_AVATAR = "/default_avatar.png"; // make sure this exists in /public

// simple text normalize to compare usernames case-insensitively
const norm = (s) => (s || "").toLowerCase().trim();

export default function GroupSettings({ me }) {
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]); // [{ user_id, username, avatarUrl }]
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(""); 

  const myId = me?.user_id;
  const myUsername = me?.username;

  const friendsSet = useMemo(
    () => new Set(friends.map((f) => norm(f.username))),
    [friends]
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await fetchMyFriends();
      setFriends(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("fetchMyFriends failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onAdd = async () => {
    setError("");
    const u = norm(input);
    if (!u) return;

    if (u === norm(myUsername)) {
      setError("You can’t add yourself.");
      return;
    }
    if (friendsSet.has(u)) {
      setError("Already in your friends list.");
      return;
    }

    try {
      setPending(true);
      // 1) Does this user exist?
      const user = await lookupUserByUsername(u);

      // 2) Optimistic UI so the friend appears immediately (with avatar)
      setFriends((prev) => [
        ...prev,
        {
          user_id: user.user_id,
          username: user.username,
          avatarUrl: user.avatarUrl || DEFAULT_AVATAR,
          __optimistic: true,
        },
      ]);

      // 3) Add by ID (backend also creates reciprocal)
      await addFriendById(user.user_id);

      // 4) Refresh to replace optimistic row with canonical data
      await refresh();
      setInput("");
      setAdding(false);

      // 5) Success flash
      setNotice(`Friend added: ${user.username}`);
      setTimeout(() => setNotice(""), 2500);
    } catch (e) {
      if (String(e.message).includes("NOT_FOUND")) {
        setError("No account with that username.");
      } else {
        setError("Could not add friend. Try again.");
      }
    } finally {
      setPending(false);
    }
  };

  const onRemove = async (friendId) => {
    try {
      await removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.user_id !== friendId));
    } catch (e) {
      console.error("removeFriend failed:", e);
    }
  };

  return (
    <div className="inline-section">
      <h4>Group Settings</h4>

      <div className="white-box">
        {!!notice && (
          <div className="flash-success" role="status" aria-live="polite">
            {notice}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 12 }}>Loading friends…</div>
        ) : (
          <div className="dietary-pill-container">
            {friends.length === 0 && (
              <div className="dietary-pill-hint"></div>
            )}

            {/* existing friends */}
            {friends.map((f) => (
            <div className="pill-icon" key={f.user_id} title={f.username} aria-label={f.username}>
              <div className="pill-circle">
                <img
                  src={f.avatarUrl || DEFAULT_AVATAR}
                  alt={f.username}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallback) {
                      e.currentTarget.dataset.fallback = "1";
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }
                  }}
                />
                {/* use the same close class as FoodPreferences */}
                <button
                  type="button"
                  className="pill-remove"
                  aria-label={`Remove ${f.username}`}
                  onClick={() => onRemove(f.user_id)}
                >
                  ×
                </button>
              </div>
              <span className="pill-label">{f.username}</span>
            </div>
          ))}

            {/* Add Friend pill OR input row */}
            {!adding ? (
              <div
                className="dietary-pill-icon add-pill"
                role="button"
                tabIndex={0}
                onClick={() => setAdding(true)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setAdding(true) : null)}
                title="Add Friend"
              >
                <img src="/add_pref_icon.png" alt="Add Friend" />
                <span>Add Friend</span>
              </div>
            ) : (
              <div className="pill-add-row">
                <img src="/add_pref_icon.png" alt="" aria-hidden="true" className="pill-add-icon" />
                <input
                  type="text"
                  placeholder="Type a username exactly (e.g., banana_gato)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !pending ? onAdd() : null}
                  disabled={pending}
                />
                <button className="btn-primary" disabled={pending} onClick={onAdd}>
                  {pending ? "Adding…" : "Add"}
                </button>
                <button
                  className="btn-ghost"
                  disabled={pending}
                  onClick={() => { setAdding(false); setInput(""); setError(""); }}
                >
                  Cancel
                </button>
              </div>
            )}

            {!!error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
