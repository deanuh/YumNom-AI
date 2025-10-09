import React from "react";
import "../styles/restaurantSearch.css";

// Static list of category options.
// Each has a display name + matching image filename (from /public assets).
const categories = [
  { name: "Bakery",   img: "Baked.png" },
  { name: "Burger",   img: "Burger.png" },
  { name: "Beverage", img: "Coffee.png" },
  { name: "Chicken",  img: "Chickenleg.png" },
  { name: "Pizza",    img: "pizza.png" },
  { name: "Seafood",  img: "fish.png" },
];
/**
 * Category component
 *
 * Props:
 *  - onPick(name): callback when user clicks a category
 *  - active: name of the currently selected category
 *
 * Renders a grid of category buttons (Bakery, Burger, etc).
 * Highlights the active one and calls onPick() when clicked.
 */
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
