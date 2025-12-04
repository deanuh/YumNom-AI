// src/components/Dashboard/FriendsList.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyFriends, removeFriend } from "../../userapi/friendsApi";

const FALLBACKS = ["/ban_gato.png", "/lebron.png", "/apple.png", "/miku.png", "/gato.png"];

// Choose the best display name available
const nameOf = (f) =>
  f?.displayName || f?.name || f?.username || f?.handle || f?.email?.split("@")[0] || "Friend";

// Choose the best avatar available
const avatarOf = (f, i) =>
  f?.avatarUrl || f?.photoURL || f?.avatar || f?.imageUrl || FALLBACKS[i % FALLBACKS.length];

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

  // Optional: quick remove
  const onRemove = async (friend) => {
    try {
      await removeFriend(friend.id || friend._id || friend.user_id || friend.uid);
      setFriends((prev) =>
        prev.filter(
          (f) =>
            (f.id || f._id || f.user_id || f.uid) !==
            (friend.id || friend._id || friend.user_id || friend.uid)
        )
      );
    } catch {
      // silent fail
    }
  };

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
                friends.map((f, i) => (
                  <div key={f.id || f._id || f.user_id || f.uid || i} style={{ position: "relative" }}>
                    <img
                      src={avatarOf(f, i)}
                      alt={nameOf(f)}
                      title={nameOf(f)}
                      className="friend-avatar"
                    />
                  </div>
                ))}

              {/* Fallback avatars if no friends */}
              {Array.isArray(friends) && friends.length === 0 &&
                FALLBACKS.map((src, idx) => (
                  <img key={`fb-${idx}`} src={src} alt="Friend avatar" className="friend-avatar" />
                ))}
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
