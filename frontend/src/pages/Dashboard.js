// import React from "react";
import "../styles/Dashboard.css";
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import FriendsList from "../components/Dashboard/FriendsList";
import DashboardSection from "../components/Dashboard/DashboardSection";

// added this for the loading screen
import React, { useState } from "react";                   
import { useLocation } from "react-router-dom"; 

// we are going to import the splash overlay so that when it fades it shows the dashbaord
import YumNomSplash from "../components/YumNomSplash"; 


const Dashboard = () => {
  const location = useLocation();                            // <-- ADDED
  const [showSplash, setShowSplash] = useState(
    location.state?.showSplash === true                      // <-- ADDED
  );

  // WHEN SPLASH FINISHES FADING OUT
  const handleSplashFinish = () => {                         // <-- ADDED
    setShowSplash(false);
  };
  return (
    <>
    {showSplash && (                                        // <-- ADDED
        <YumNomSplash
          duration={2000}         // bounce animation time
          fadeDuration={450}      // fade-out transition
          onFinish={handleSplashFinish}
        />
      )}
    <div className="dashboard-container">
      <DashboardHeader />
      <FriendsList />
      <DashboardSection title="Your Recent AI Dish Recommendation!" />
      <DashboardSection title="Your Favorites" />
    </div>
    </>
  );
};

export default Dashboard;
