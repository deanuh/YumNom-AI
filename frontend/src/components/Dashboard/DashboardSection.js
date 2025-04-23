import React from "react";
import DishCard from "./DishCard";

const DashboardSection = ({ title }) => {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h3>{title}</h3>
        <button className="view-all-btn">View all ❯ </button>
      </div>
      <div className="dish-list">
        <DishCard />
        <DishCard />
        <DishCard />
        <DishCard />
        <DishCard />
      </div>
    </div>
  );
};

export default DashboardSection;
