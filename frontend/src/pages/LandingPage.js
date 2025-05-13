// frontend/src/pages/LandingPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

import IconStack  from "../pages/images/LandingIcons.png";
import StarIcon   from "../pages/images/star.png";
import GroupIcon  from "../pages/images/group.png";
import SearchIcon from "../pages/images/search.png";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      {/* ─── HERO / HEADING ─────────────────────────────────── */}
      <section className="landing-heading">
        <div className="landing-heading-left">
          <h1 className="landing-logo">YUMNOM AI</h1>

          <div className="landing-text">
            <h2>
              AI‑POWERED DISH<br />
              RECOMMENDATIONS
            </h2>

            <h3>
              Start your Personalized<br />
              Food Journey!
            </h3>

            <p>Discover dishes tailored to your taste and needs.</p>

            <button
              className="landing-cta"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="landing-icon-stack">
          <img src={IconStack} alt="Array of food‑category icons" />
        </div>
      </section>

      {/* ─── FEATURE CARDS ─────────────────────────────────── */}
      <section className="landing-features">
        <div className="landing-feature-card">
          <img
            src={StarIcon}
            alt="Star symbol"
            className="landing-feature-icon"
          />
          <p>
            Personalized Dish
            <br />
            Recommendations
          </p>
        </div>

        <div className="landing-feature-card">
          <img
            src={GroupIcon}
            alt="Group of people"
            className="landing-feature-icon"
          />
          <p>Group Party!</p>
        </div>

        <div className="landing-feature-card">
          <img
            src={SearchIcon}
            alt="Magnifying glass"
            className="landing-feature-icon"
          />
          <p>Restaurant Search</p>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
