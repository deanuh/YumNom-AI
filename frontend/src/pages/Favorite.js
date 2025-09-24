import React, { useEffect, useState } from "react";
import "../styles/favorite.css";
import DishCard from "../components/Dashboard/DishCard";
import { getAuth } from "firebase/auth";

async function fetchWithAuth(url, init = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  const headers = { ...(init.headers || {}) };
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return fetch(url, { ...init, headers, credentials: "include" });
}

function Favorite() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeType, setActiveType] = useState("restaurants"); // "restaurants" | "dishes"
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  async function loadFavorites(reset = false) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({ type: activeType, limit: "20" });
      if (!reset && cursor) params.set("cursor", cursor);
      const res = await fetchWithAuth(`/favorites?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load favorites (${res.status})`);
      const data = await res.json();
      setItems((prev) => (reset ? data.items : [...prev, ...(data.items || [])]));
      setCursor(data.nextCursor);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites(true);
  }, [activeType]);

  async function removeFavorite(id) {
    try {
      const res = await fetchWithAuth(`/favorites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      setItems((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="favorite-page">
      <div className="favorite-header">
        <h3 className="favorite-title">Favorites</h3>

        <div className="dropdown-wrapper">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
            <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" />
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  setActiveType("restaurants");
                  setShowDropdown(false);
                }}
              >
                Restaurants
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setActiveType("dishes");
                  setShowDropdown(false);
                }}
              >
                Dishes
              </button>
            </div>
          )}
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="favorite-grid">
        {items.map((fav) => (
          <DishCard
            key={fav.id}
            data={fav}                 
            onRemove={() => removeFavorite(fav.id)}
          />
        ))}
      </div>

      <div className="favorite-footer">
        {cursor && (
          <button disabled={loading} onClick={() => loadFavorites(false)}>
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Favorite;
