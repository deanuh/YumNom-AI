import React from "react";
import "../styles/restaurantSearch.css";

// If your icons are in public/assets/, list just the filenames here.
const categories = [
  { name: "Bakery",   img: "Baked.png" },
  { name: "Burger",   img: "Burger.png" },
  { name: "Beverage", img: "Coffee.png" },
  { name: "Chicken",  img: "Chickenleg.png" },
  { name: "Pizza",    img: "pizza.png" },
  { name: "Seafood",  img: "fish.png" },
];

export default function Category({ onPick, active }) {
  return (
    <div className="main-body">
      <h3>Category</h3>
      <div className="category-grid">
        {categories.map((item) => {
          const isActive = active === item.name;
          return (
            <button
              key={item.name}
              type="button"
              className={`category-card${isActive ? " category-card--active" : ""}`}
              onClick={() => onPick && onPick(item.name)}
              aria-pressed={isActive}
            >
              <img
                src={`/${item.img}`}
                alt={item.name}
                className="category-dish-img"
              />
              <p>{item.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
