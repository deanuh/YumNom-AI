// src/components/Dashboard/FriendsList.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyFriends} from "../../userapi/friendsApi";

// Choose the best display name available
const nameOf = (f) =>
  f?.displayName || f?.name || f?.username || f?.handle || f?.email?.split("@")[0] || "Friend";

// Choose the best avatar available
const avatarOf = (f) =>
  f?.avatarUrl || f?.photoURL || f?.avatar || f?.imageUrl || null;

export default function FriendsList() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [friends, setFriends] = useState(null); // null = loading, [] = empty
  const [error, setError] = useState("");

  // Load from backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await fetchMyFriends();
        if (!alive) return;
        setFriends(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!alive) return;
        setError("Could not load friends.");
        setFriends([]); // still render the widget
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });


  return (
    <div className="friends-section">
      <h2>Your Friends List &lt;3</h2>

      <div className="friends-box">
        <div className="friends-container">
          <button className="scroll-arrow" onClick={scrollLeft}>
            ❮
          </button>

          {/* Scrollable friend avatars */}
          <div className="friends-scroll-wrapper friends-list-wrapper" ref={scrollRef}>
            <div className="friends-list">
              {/* Loading placeholders */}
              {friends === null &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={`sk-${i}`} className="friend-avatar" style={{ background: "#eee" }} />
                ))}

              {/* Real friends */}
              {Array.isArray(friends) && friends.length > 0 &&
                friends.map((f, i) => {
                  const avatar = avatarOf(f);
                  const name = nameOf(f);

                  return (
                    <div
                      key={f.id || f._id || f.user_id || f.uid || i}
                      className="friend-item"
                    >
                      <img
                        src={avatar ? avatar : "/default_avatar.png"}
                        alt={name}
                        className="friend-avatar"
                      />
                      <div className="friend-name">{name}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          <button className="scroll-arrow" onClick={scrollRight}>
            ❯
          </button>
        </div>

        <div className="add-friends">
          <button
            className="add-friend-btn"
            onClick={() => navigate("/userprofile")}
          >
            add more friends
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "#9b1c1c", fontSize: 12, marginTop: 6 }}>{error}</div>
      )}
    </div>
  );
}
