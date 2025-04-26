import React, { useState } from 'react';

const DishCard = () => {
  const [isFavorite, setIsFavorite] = useState(false); 
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
      <img src="/chicken.png" alt="Dish" className="dish-img" />
      <p className="restaurant-name">Restaurant Name</p>
      <p className="dish-name">Dish Name</p>
      <button className="menu-button">View Menu</button>
    </div>
  );
};

export default DishCard;
