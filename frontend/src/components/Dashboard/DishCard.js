import React from "react";

const DishCard = ({ name, address, distance, imageUrl, onViewMenu, isFavorited, onToggleFavorite }) => {
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

          {/* This button is only shown if the onToggleFavorite function is provided */}
          {onToggleFavorite && (
            <button
              type="button"
              className="favorite-btn"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorited}
              // It now calls the function passed down from the parent (e.g., Favorite.js)
              onClick={onToggleFavorite} 
            >
              <img
                // The heart icon's appearance is now controlled by the isFavorited prop
                src={isFavorited ? "/heart_dark.png" : "/heart.png"}
                alt=""
                className="heart-icon"
              />
            </button>
          )}
        </div>

        <button type="button" className="menu-cta" onClick={onViewMenu}>
          View Restaurant
        </button>
      </div>
    </div>
  );
};

export default DishCard;