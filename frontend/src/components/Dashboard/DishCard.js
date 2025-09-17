import React, { useState } from "react";

const DishCard = ({ name, address, distance, imageUrl, onViewMenu }) => {
  const [isFavorite, setIsFavorite] = useState(false);
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
