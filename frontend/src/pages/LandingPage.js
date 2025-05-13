// frontend/src/pages/LandingPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

import IconStack   from "../pages/images/LandingIcons.png";
import StarIcon    from "../pages/images/star.png";
import GroupIcon   from "../pages/images/group.png";
import SearchIcon  from "../pages/images/search.png";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">

      {/* HERO */}
      <section className="hero">

        {/* LEFT SIDE  ─ logo + copy ───────────────────────────── */}
        <div className="hero-left">
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
              className="get-started"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>
          </div>
        </div>

        {/* RIGHT SIDE  ─ icon cluster ─────────────────────────── */}
        <div className="icon-stack">
          <img src={IconStack} alt="Feature bubbles" />
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="landing-features">
        <div className="feature-card">
          <img src={StarIcon}   alt="" className="feature-icon" />
          <p>Personalized Dish<br />Recommendations</p>
        </div>
        <div className="feature-card">
          <img src={GroupIcon}  alt="" className="feature-icon" />
          <p>Group Party!</p>
        </div>
        <div className="feature-card">
          <img src={SearchIcon} alt="" className="feature-icon" />
          <p>Restaurant Search</p>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
