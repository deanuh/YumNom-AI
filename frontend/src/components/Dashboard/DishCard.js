// DishCard.js
import React from "react";

const DishCard = ({ name, address, distance, imageUrl, onViewMenu, isFavorited, onToggleFavorite }) => {
  const fallback = "/chicken.png";

  return (
    <div className="dish-card minimal" onClick={onViewMenu}>
      {/* Image */}
      <div className="dish-img-wrapper">
        <img
          src={imageUrl || fallback}
          alt={name}
          className="dish-img"
          loading="lazy"
        />

        {/* Floating favorite heart */}
        {onToggleFavorite && (
          <button
            type="button"
            className="heart-float"
            onClick={(e) => {
              e.stopPropagation();   // prevents opening menu when clicking heart
              onToggleFavorite();
            }}
          >
            <img
              src={isFavorited ? "/heart_dark.png" : "/heart.png"}
              alt="favorite"
              className="heart-icon"
            />
          </button>
        )}
      </div>

      {/* Text content */}
      <div className="dish-info">
        <p className="dish-name">{name}</p>
        <span className="dish-distance">{distance}</span>
      </div>
    </div>
  );
};

export default DishCard;
