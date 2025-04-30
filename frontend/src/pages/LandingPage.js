import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <section className="hero">
        <header className="landing-logo">YUMNOM AI</header>

        <div className="landing-text">
          <h1>AI-POWERED DISH<br />RECOMMENDATIONS</h1>

          <h2>Start your Personalized<br />Food Journey!</h2>
          <p>Discover dishes tailored to your taste and needs.</p>

          <button
            className="get-started"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>

        <div className="landing-icons">
          <span className="icon pizza" />
          <span className="icon burger" />
          <span className="icon fish" />
          <span className="icon plate" />
          <span className="icon menu" />
          <span className="icon diet" />
        </div>

      </section>


      <section className="landing-features">
        <div className="feature-card">
          <span className="card-icon star" />
          <p>Personalized Dish<br />Recommendations</p>
        </div>
        <div className="feature-card">
          <span className="card-icon group" />
          <p>Group Party!</p>
        </div>
        <div className="feature-card">
          <span className="card-icon search" />
          <p>Restaurant Search</p>
        </div>

      </section>
    </div>
  );
}

export default LandingPage;
