import React, { useState } from "react";

/**
 * DishCard Component
 *
 * Displays a restaurant "card" with:
 *  - Image (with fallback if missing)
 *  - Restaurant name + distance
 *  - Favorite (heart) button (local toggle only)
 *  - "View Restaurant" button that triggers callback
 *
 * Props:
 *  - name: string (restaurant name)
 *  - address: string (not currently displayed, but passed in)
 *  - distance: string (e.g., "2.3 mi")
 *  - imageUrl: string (URL of restaurant photo)
 *  - onViewMenu: function callback when user clicks "View Restaurant"
 */
const DishCard = ({ name, address, distance, imageUrl, onViewMenu }) => {
// Track local "favorite" state for this card (not persisted anywhere yet)
  const [isFavorite, setIsFavorite] = useState(false);
  // Fallback image if no restaurant photo available
  const fallback = "/chicken.png";

  return (
    <div className="dish-card">
      <img
        src={imageUrl || fallback}
        alt={name}
        className="dish-img"
        loading="lazy"
      />

      <div className="card-body">
        <div className="meta-header">
          <div className="meta-left">
            <p className="restaurant-name">{name}</p>
            {distance && <span className="distance-inline">{distance}</span>}
          </div>

          <button
            type="button"
            className="favorite-btn"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
            onClick={() => setIsFavorite(prev => !prev)}
          >
            <img
              src={isFavorite ? "/heart_dark.png" : "/heart.png"}
              alt=""
              className="heart-icon"
            />
          </button>
        </div>

        <button type="button" className="menu-cta" onClick={onViewMenu}>
          View Restaurant
        </button>
      </div>
    </div>
  );
};

export default DishCard;
