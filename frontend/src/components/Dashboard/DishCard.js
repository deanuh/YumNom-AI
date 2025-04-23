import React from "react";

const DishCard = () => {
  return (
    <div className="dish-card">
      <img src="/chicken.png" alt="Dish" className="dish-img" />
      <p className="restaurant-name">Restaurant Name</p>
      <p className="dish-name">Dish Name</p>
      <button className="menu-button">View Menu</button>
    </div>
  );
};

export default DishCard;
