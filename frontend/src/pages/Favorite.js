import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../ThemeProvider";
import "../styles/favorite.css";
import DishCard from "../components/Dashboard/DishCard";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Auth Helper
async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in.");
  
  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  return fetch(url, { ...options, headers });
}

function Favorite() {
	const { theme } = useContext(ThemeContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeType, setActiveType] = useState("restaurants");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toggleDropdown = () => setShowDropdown(prev => !prev);

  const handleUnfavorite = async (itemId) => {
    try {
      const res = await fetchWithAuth(`http://localhost:5001/favorites/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove.');
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (e) {
      alert(e.message);
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
          const params = new URLSearchParams({ type: activeType, limit: "50" });
          const res = await fetchWithAuth(`http://localhost:5001/favorites?${params.toString()}`);
          if (!res.ok) throw new Error(`Failed to load favorites`);
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
        <div className="favorite-dropdown-wrapper">
          <button className="favorite-dropdown-toggle" onClick={toggleDropdown}>
          {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
            <img src={ theme === 'light' ? "/Vector.png" : "/VectorDark.png" } alt="arrow" className="favorite-dropdown-arrow" />
          </button>
          {showDropdown && (
            <div className="favorite-dropdown-menu">
              <button
                className="favorite-dropdown-item"
                onClick={() => {
                  setActiveType("restaurants");
                  setShowDropdown(false);
                }}
              >
                Restaurants
              </button>
              <button
                className="favorite-dropdown-item"
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
                name={fav.name}
                imageUrl={fav.photo_url}
                isFavorited={true} 
                onToggleFavorite={() => handleUnfavorite(fav.id)} 
                type={activeType}
                onViewMenu={() => console.log("View:", fav.name)}
              />
          ))}
        </div>
      )}
      
      {!loading && items.length === 0 && <p>No favorites found.</p>}
    </div>
  );
}

export default Favorite;
