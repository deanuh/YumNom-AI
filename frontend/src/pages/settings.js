// // this will be the display for the settings page
import React from "react";
import { Link } from "react-router-dom";
import "../styles/settings.css";

function Settings() {
  return (
    <div className="settings-wrapper">
      <div className="settings-card">
        <h2 className="settings-title">Settings & Activity</h2>

        <div className="settings-section">
          <h3 className="section-heading">General Settings</h3>
          <ul className="settings-list">
            <li><Link to="/changePass">Change Password</Link></li>
            <li><Link to="/emailSettings">Email</Link></li>
            <li><Link to="/locationPref">Location Preferences</Link></li>
            <li><Link to="#">Notifications</Link></li>
            <li><Link to="#">Display</Link></li>
          </ul>
        </div>

        <div className="settings-section">
          <h3 className="section-heading">Legal</h3>
          <ul className="settings-list">
            <li><Link to="/terms">Terms</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className="settings-section">
          <h3 className="section-heading">Account</h3>
          <ul className="settings-list">
            <li><Link to="/help">Help</Link></li>
            <li><Link to="#">Report Abuse</Link></li>
            <li><Link to="#">Delete Account</Link></li>
            <li><Link to="#">Log out</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;



