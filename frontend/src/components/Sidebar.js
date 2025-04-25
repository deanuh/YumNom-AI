import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <img src="/main_icon.png" alt="YumNom AI logo" className="logo-icon" />

      <nav className="nav-links">
        <Link to="/dashboard" className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}>
          <img
            src={location.pathname === "/dashboard" ? "/dashboard_white.png" : "/dashboard_purple.png"}
            alt="Dashboard"
            className="nav-icon"
          />
          Dashboard
        </Link>

        <Link to="/restaurantSearch" className={`nav-item ${location.pathname === "/restaurantSearch" ? "active" : ""}`}>
          <img
            src={location.pathname === "/search" ? "/search_rest_white.png" : "/search_resturant_purple.png"}
            alt="restaurantSearch"
            className="nav-icon"
          />
          Search restaurant?
        </Link>

        <Link to="/favorite" className={`nav-item ${location.pathname === "/favorite" ? "active" : ""}`}>
          <img
            src={location.pathname === "/favorite" ? "/fav_white.png" : "/fav_purple.png"}
            alt="Favorite"
            className="nav-icon"
          />
          Favorite
        </Link>

        <Link to="/ai-recommendation" className={`nav-item ${location.pathname === "/ai-recommendation" ? "active" : ""}`}>
          <img
            src={location.pathname === "/ai-recommendation" ? "/ai_rec_white.png" : "/ai_rec_purple.png"}
            alt="AI Recommendation"
            className="nav-icon"
          />
          AI Recommendation
        </Link>

        <Link to="/userprofile" className={`nav-item ${location.pathname === "/userprofile" ? "active" : ""}`}>
          <img
            src={location.pathname === "/userprofile" ? "/user_white.png" : "/user_purple.png"}
            alt="User Profile"
            className="nav-icon"
          />
          User Profile
        </Link>

        <Link to="/contact" className={`nav-item ${location.pathname === "/contact" ? "active" : ""}`}>
          <img
            src={location.pathname === "/contact" ? "/contact_white.png" : "/contact_purpe.png"}
            alt="Contact Us"
            className="nav-icon"
          />
          Contact Us
        </Link>

        <Link to="/settings" className={`nav-item ${location.pathname === "/settings" ? "active" : ""}`}>
          <img
            src={location.pathname === "/settings" ? "/setting_white.png" : "/setting_purple.png"}
            alt="Settings"
            className="nav-icon"
          />
          Setting
        </Link>
      </nav>

      <div className="group-party-box">
        <p>Start A Group Party</p>
        <button className="invite-btn">Send Invite</button>
      </div>

      <p className="report-issue">Report an issue</p>
    </div>
  );
};

export default Sidebar;