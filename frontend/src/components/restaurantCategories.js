import React from "react";
import "../styles/restaurantSearch.css"; // make sure it’s the correct path
import "../styles/Dashboard.css";

const categories = [
  { name: "Bakery", img: "../Baked.png" },
  { name: "Burger", img: "../Burger.png" },
  { name: "Beverage", img: "../Coffee.png" },
  { name: "Chicken", img: "../Chickenleg.png" },
  { name: "Pizza", img: "../pizza.png" },
  { name: "Seafood", img: "../fish.png" },
];

const Category = () => {
  return (
    <div className="category-grid">
      {categories.map((item) => (
        <div key={item.name} className="category-card">
          <img
            src={`/assets/${item.img}`} // ⬅️ assumes images are in public/assets/
            alt={item.name}
            className="dish-img"
          />
          <p>{item.name}</p>
        </div>
      ))}
    </div>
  );
};

export default Category;
