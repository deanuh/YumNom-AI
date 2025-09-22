import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";  // to navigate between pages
import "../../styles/settings.css";

export default function LocationPref() {
  const navigate = useNavigate();

  // Default ON unless user has turned it off before
  const [isSharing, setIsSharing] = useState(() => {
    try {
      const stored = localStorage.getItem("yumNomLocationSharing");  // we will use the useState of isSharing or not to see if we
      // get the location from GetUserLoc in restaurant search
      if (stored !== null) return JSON.parse(stored);
      const legacy = localStorage.getItem("yumNomLocationOptOut");
      return legacy !== null ? !JSON.parse(legacy) : true;
    } 
    catch {
      return true;
    }
  });

  // Persist the toggle and keep legacy inverse for any old code
  useEffect(() => {
    localStorage.setItem("yumNomLocationSharing", JSON.stringify(isSharing)); // using local storage each time for app so that the location pref will 
    // stay persistent throughout the whole app usage (need to check if it will work once deployed - it should)
    localStorage.setItem("yumNomLocationOptOut", JSON.stringify(!isSharing));
  }, [isSharing]);

  return (
    <main className="lp-container">
      <button className="Set-back-button lp-back" onClick={() => navigate("/settings")}>
        ← Back to Settings
      </button>

      <h1 className="lp-title">Location Preferences</h1>
      <p className="lp-subtitle">
        Allow YumNom to use your device location for nearby restaurant results.
      </p>

      {/* Sharing toggle: ON when checked, OFF when unchecked */}
      <div className="lp-row">
        <label className="lp-switch">
          <input
            type="checkbox"
            checked={isSharing} // ON by default
            onChange={(e) => setIsSharing(e.target.checked)}
          />
          <span className="lp-slider" />
        </label>

        <div className="lp-row-text">
          <div className="lp-row-title">
            {isSharing ? "Location sharing is ON" : "Location sharing is OFF"}
          </div>
          <div className="lp-row-sub">
            {isSharing
              ? "We may request your device location when searching for restaurants."
              : "We won’t request your device location."}
          </div>
        </div>
      </div>
    </main>
  );
}
