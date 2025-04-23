import React from "react";

const DashboardHeader = () => {
  return (
    <div className="dashboard-header">
      <h1>Hello, [Name]</h1>
      <div className="dashboard-banner">
        <div className="banner-text">
          <h2>Start your personal food journey</h2>
          <p>AI-Powered Dish Recommendations Made Just for You.</p>
        </div>
        <button className="banner-button">GET STARTED</button>
      </div>
      <div className="edit-note">
        <span className="edit-text">Edit your Dashboard to your liking!</span>
        <img src="/edit_icon.png" alt="Edit" className="edit-img"/>
      </div>
      <div className="your-dash">
        <h1>Your Personalized Dashboard!</h1>
      </div>
    </div>
  );
};

export default DashboardHeader;
