// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import FriendsList from "../components/Dashboard/FriendsList";
import DashboardSection from "../components/Dashboard/DashboardSection";
import DishCard from "../components/Dashboard/DishCard";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const RECENTS_KEY = "yn_recent_restaurants";     // restaurant clicks
const AI_HISTORY_KEY = "yn_ai_rec_history_v1";   // AI dish history
const DEFAULT_LAYOUT = ["friends", "recent", "recentRestaurants", "favorites"]; // recent=AI

async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const token = await user.getIdToken();
  const headers = { ...options.headers, Authorization: `Bearer ${token}` };
  return fetch(url, { ...options, headers });
}

// added this for the loading screen
import React, { useState } from "react";                   
import { useLocation } from "react-router-dom"; 

// we are going to import the splash overlay so that when it fades it shows the dashbaord
import YumNomSplash from "../components/YumNomSplash"; 


const Dashboard = () => {
  const location = useLocation();                            // <-- ADDED
  const [showSplash, setShowSplash] = useState(
    location.state?.showSplash === true                      // <-- ADDED
  );

  // WHEN SPLASH FINISHES FADING OUT
  const handleSplashFinish = () => {                         // <-- ADDED
    setShowSplash(false);
  };
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState(() => {
    // migrate old layouts (that didn’t include recentRestaurants)
    try {
      const saved = JSON.parse(localStorage.getItem("dashLayout"));
      if (Array.isArray(saved) && saved.length) {
        const need = ["friends", "recent", "recentRestaurants", "favorites"];
        const merged = [...saved];
        need.forEach((k) => { if (!merged.includes(k)) merged.splice(merged.length - 1, 0, k); });
        return merged;
      }
      return DEFAULT_LAYOUT;
    } catch {
      return DEFAULT_LAYOUT;
    }
  });

  // data
  const [aiRecs, setAiRecs] = useState([]);   // AI dish history
  const [recents, setRecents] = useState([]); // restaurant clicks
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    localStorage.setItem("dashLayout", JSON.stringify(layout));
  }, [layout]);

  // load AI rec history
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || "[]");
      setAiRecs(Array.isArray(saved) ? saved : []);
    } catch { setAiRecs([]); }
  }, []);

  // load restaurant click recents
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
      setRecents(Array.isArray(saved) ? saved : []);
    } catch { setRecents([]); }
  }, []);

  // fetch favorites when logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      if (!user) { setFavorites([]); return; }
      (async () => {
        try {
          const res = await fetchWithAuth("http://localhost:5001/favorites");
          if (!res.ok) throw new Error("favorites fetch failed");
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.items;
          setFavorites(Array.isArray(items) ? items : []);
        } catch (e) {
          console.error("Failed to load favorites:", e);
          setFavorites([]);
        }
      })();
    });
    return () => unsub();
  }, []);

  const removeFavorite = async (favoriteId) => {
    try {
      const res = await fetchWithAuth(`http://localhost:5001/favorites/${favoriteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch (e) {
      console.error("Failed to remove favorite:", e);
    }
  };

  const move = (from, to) => {
    if (from === to) return;
    const next = [...layout];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setLayout(next);
  };

  const onDropTo = (toIndex, fromIndexStr) => {
    const from = Number(fromIndexStr);
    if (!Number.isNaN(from)) move(from, toIndex);
  };

  const renderSection = (key) => {
    switch (key) {
      case "friends":
        return <FriendsList />;

      // AI dish history
      case "recent":
        return (
          <DashboardSection
            title="Your Recent AI Dish Recommendation!"
            viewAllHref="/ai-result"
          >
            <div className="dish-list">
              {aiRecs.slice(0, 10).map((r) => (
                <DishCard
                  key={r.id}
                  name={r.name}
                  address={r.cuisine || ""} // subtitle line
                  imageUrl={r.imageUrl}
                  onViewMenu={() => {
                    const q = encodeURIComponent(r.name);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                  }}
                />
              ))}
              {aiRecs.length === 0 && <p>No AI recommendations yet.</p>}
            </div>
          </DashboardSection>
        );

      // restaurant click history
      case "recentRestaurants":
        return (
          <DashboardSection
            title="Recently Viewed Restaurants"
            viewAllHref="/restaurantSearch"
          >
            <div className="dish-list">
              {recents.slice(0, 10).map((r) => (
                <DishCard
                  key={r.id || `${r.name}-${r.address}`}
                  name={r.name}
                  address={r.address}
                  imageUrl={r.imageUrl}
                  onViewMenu={() => {
                    const q = encodeURIComponent(`${r.name} ${r.address || ""}`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                  }}
                />
              ))}
              {recents.length === 0 && <p>No recent restaurant views yet.</p>}
            </div>
          </DashboardSection>
        );

      case "favorites":
        return (
          <DashboardSection title="Your Favorites" viewAllHref="/favorite">
            <div className="dish-list">
              {favorites.slice(0, 10).map((f) => (
                <DishCard
                  key={f.id || `${f.name}-${f.address}`}
                  name={f.name}
                  address={f.address || ""}
                  imageUrl={f.photo_url || f.imageUrl || null}
                  isFavorited={true}
                  onToggleFavorite={() => removeFavorite(f.id)}
                  onViewMenu={() => {
                    const q = encodeURIComponent(`${f.name} ${f.address || ""}`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                  }}
                />
              ))}
              {favorites.length === 0 && <p>No favorites yet.</p>}
            </div>
          </DashboardSection>
        );

      default:
        return null;
    }
  };

  return (
    <>
    {showSplash && (                                        // <-- ADDED
        <YumNomSplash
          duration={2000}         // bounce animation time
          fadeDuration={450}      // fade-out transition
          onFinish={handleSplashFinish}
        />
      )}
    <div className="dashboard-container">
      {/* unchanged */}
      <DashboardHeader editing={editing} onToggleEdit={() => setEditing((v) => !v)} />

      <ol
        className={`dash-sections ${editing ? "is-editing" : ""}`}
        aria-label="Dashboard sections"
      >
        {layout.map((key, index) => (
          <li
            key={key}
            className="dash-item"
            draggable={editing}
            onDragStart={(e) => {
              if (!editing) return;
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(index));
              e.currentTarget.classList.add("dragging");
            }}
            onDragEnd={(e) => e.currentTarget.classList.remove("dragging")}
            onDragOver={(e) => {
              if (!editing) return;
              e.preventDefault();
              e.currentTarget.classList.add("droptarget");
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove("droptarget")}
            onDrop={(e) => {
              if (!editing) return;
              e.preventDefault();
              e.currentTarget.classList.remove("droptarget");
              onDropTo(index, e.dataTransfer.getData("text/plain"));
            }}
          >
            {editing && (
              <div className="drag-hint" aria-hidden>
                <span className="handle">⋮⋮</span> Drag to reorder
              </div>
            )}
            {renderSection(key)}
          </li>
        ))}
      </ol>

      {editing && (
        <div className="edit-actions">
          <button type="button" className="edit-reset" onClick={() => setLayout(DEFAULT_LAYOUT)}>
            Reset layout
          </button>
          <button type="button" className="edit-done" onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default Dashboard;
