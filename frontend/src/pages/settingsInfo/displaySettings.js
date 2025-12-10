// to change the display of their screen (lightmode darkmode?)
// need to set up the UI actually but also need to wait for teammate to create the code for
// src/pages/displaySettings.js
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../ThemeProvider";
import "../../styles/settings.css";

export default function DisplaySettings() {
  const navigate = useNavigate();
	const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <main className="Set-settings-body">
      <button className="Set-back-button" onClick={() => navigate("/settings")}>
        ← Back to Settings
      </button>

      <div className="Set-settings-card">
        <h1 className="Set-settings-title">Display Settings</h1>

        <section className="Set-settings-section">
          <h2 className="Set-section-heading">Theme</h2>
          {/* need to fix this line 23, bc it looks weird on the app */}
          <ul className="Set-settings-list"> 
            <li>
              <span>Dark Mode</span>
              {/* Just a visual toggle, have not coded for it yet!!*/}
              <label className="lp-switch">
                <input 
									type="checkbox"
									checked={theme === 'dark'}
									onChange={(e) => toggleTheme()}/>
                <span className="lp-slider" />
              </label>
            </li>
          </ul>
          <p className="lp-footnote">
            Choose between light mode or dark mode for your YumNom experience.
          </p>
        </section>
      </div>
    </main>
  );
}
