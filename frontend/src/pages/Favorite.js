import React, { useEffect, useState } from "react";
import "../styles/favorite.css";
import DishCard from "../components/Dashboard/DishCard";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Helper function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to perform this action.");
  }
  
  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, { ...options, headers });
}

function Favorite() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeType, setActiveType] = useState("restaurants");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toggleDropdown = () => setShowDropdown(prev => !prev);

  const handleUnfavorite = async (itemId) => {
    try {
      const res = await fetchWithAuth(`http://localhost:5001/favorites/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove favorite.');
      }
      // Instantly remove the item from the UI for a fast user experience
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    setItems([]); 

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const params = new URLSearchParams({ type: activeType, limit: "20" });
          const res = await fetchWithAuth(`http://localhost:5001/favorites?${params.toString()}`);
          
          if (!res.ok) {
            throw new Error(`Failed to load favorites (${res.status})`);
          }
          const data = await res.json();
          setItems(data.items || []);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      } else {
        setError("Please log in to see your favorites.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [activeType]);

  return (
    <div className="favorite-page">
      <div className="favorite-header">
        <h3 className="favorite-title">Your Favorites</h3>
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

      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && items.length > 0 && (
        <div className="favorites-grid">
          {items.map((fav) => (
             <DishCard
                key={fav.id}
                // Pass all the dish data down
                name={fav.name}
                imageUrl={fav.photo_url}
                // Tell the card it IS favorited
                isFavorited={true} 
                // Give the card the function to call when the heart is clicked
                onToggleFavorite={() => handleUnfavorite(fav.id)} 
                // Pass other props the card might need
                onViewMenu={() => console.log("View menu for:", fav.name)}
              />
          ))}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
         <p>You haven't added any favorites yet.</p>
      )}
    </div>
  );
}

export default Favorite;