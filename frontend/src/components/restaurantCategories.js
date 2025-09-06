import React from "react";

// Adjust icon paths to your assets
const ITEMS = [
  { name: "Bakery",  icon: "/Baked.png" },
  { name: "Burger",  icon: "/burger.png" },
  { name: "Beverage", icon: "/coffee.png" },
  { name: "Chicken", icon: "/chickenleg.png" },
  { name: "Pizza",   icon: "/pizza.png" },
  { name: "Seafood", icon: "/fish.png" },
];

export default function Category({ onPick, active }) {
  return (
    <div className="category-grid">
      {ITEMS.map(({ name, icon }) => (
        <button
          key={name}
          type="button"
          className={`category-card${active === name ? " is-active" : ""}`}
          onClick={() => onPick && onPick(name)}
          aria-pressed={active === name}
        >
          {/* keep your existing class names so your CSS continues to style it */}
          <img src={icon} alt="" className="category-dish-img" aria-hidden="true" />
          <div className="category-label">{name}</div>
        </button>
      ))}
    </div>
  );
}
