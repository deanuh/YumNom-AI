import React from "react";
import "../styles/restaurantSearch.css"; // make sure it’s the correct path

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
    <div>
      <h3>Category</h3>
    <div className="category-grid">
      {categories.map((item) => (
        <div key={item.name} className="category-card">
          <img
            src={`/assets/${item.img}`} // ⬅️ assumes images are in public/assets/
            alt={item.name}
            className="category-dish-img"
          />
          <p>{item.name}</p>
        </div>
      ))}
    </div>
    </div>
  );
};

export default Category;
