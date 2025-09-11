import React, { useState } from "react";

const DishCard = ({ name, address, distance, imageUrl, onViewMenu }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const fallback = "/chicken.png";

  return (
    <div className="dish-card">
      <div className="heart-container">
        <img
          src={isFavorite ? "/heart_dark.png" : "/heart.png"}
          alt="Favorite"
          className="heart-icon"
          onClick={() => setIsFavorite((prev) => !prev)}
        />
      </div>

      <img
        src={imageUrl || fallback}
        alt={name}
        className="dish-img"
        loading="lazy"
      />

      <p className="restaurant-name">{name}</p>
      <p className="dish-name">{address}</p>
      {distance && <div className="distance-pill">{distance}</div>}
      <button className="menu-button" onClick={onViewMenu}>
        View Menu
      </button>
    </div>
  );
};


export default DishCard;
