import React from "react";
import "../styles/Dashboard.css";
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import FriendsList from "../components/Dashboard/FriendsList";
import DashboardSection from "../components/Dashboard/DashboardSection";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <FriendsList />
      <DashboardSection title="Your Recent AI Dish Recommendation!" />
      <DashboardSection title="Your Favorites" />
    </div>
  );
};

export default Dashboard;
