// src/pages/AIRecommendationResult.js
import React, { useEffect, useState } from "react";
import "../styles/AIRecommendationResult.css";

export default function AIRecommendationResult() {
  const [ctx, setCtx] = useState(null); // { data:{dish,reason}, prompt, likes, restrictions, excludeIds? }
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratings, setRatings] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    const saved = localStorage.getItem("ai_last_rec");
    if (saved) setCtx(JSON.parse(saved));
  }, []);

  if (!ctx) {
    return (
      <div className="ai-result-page" style={{ padding: 24 }}>
        No recommendation yet. Go back and try again.
      </div>
    );
  }

  const {
    data: { dish, reason },
    prompt,
    likes,
    restrictions,
  } = ctx;

  // API endpoints (CRA proxy forwards /api to :5001)
  const recUrl = `/api/ai/recommend`;
  const rateUrl = `/api/ai/rate`;

  const handleStarClick = (index) => {
    setRatings((prev) => {
      const next = [...prev];
      next[index] = (next[index] + 1) % 3; // 0 -> 1 -> 2 -> 0
      return next;
    });
  };

  const calcNumericRating = (arr) =>
    arr.reduce((sum, v) => sum + (v === 2 ? 1 : v === 1 ? 0.5 : 0), 0);

  async function submitRating() {
    try {
      const rating = calcNumericRating(ratings);
      await fetch(rateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId: dish.id, rating, prompt, likes, restrictions }),
      });
      alert("Thanks for the feedback!");
    } catch {
      alert("Rating saved locally (backend not available).");
    }
  }

  async function regenerate() {
    try {
      const excludeIds = [dish.id, ...(ctx.excludeIds || [])];
      const res = await fetch(recUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, likes, restrictions, excludeIds }),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      const data = await res.json(); // { dish, reason }
      const next = { ...ctx, data, excludeIds };
      localStorage.setItem("ai_last_rec", JSON.stringify(next));
      setCtx(next);
    } catch {
      alert("Could not regenerate (backend). Keeping current dish for demo.");
    }
  }

  return (
    <div className="ai-result-page">
      <h1 className="result-title">DISH CREATED FOR YOU!</h1>
      <h2 className="result-subtitle">Your AI Dish Recommendation!</h2>
      <p className="result-desc">
        Based off of your preferences and chat with our AI, we think you should try…
      </p>

      <div className="result-card">
        <div className="heart-container">
          <img
            src={isFavorite ? "/heart_dark.png" : "/heart.png"}
            alt="Favorite"
            className="heart-icon"
            onClick={() => setIsFavorite((prev) => !prev)}
          />
        </div>

        <p className="dish-title">{dish.name}</p>

        {/* Image with tuna.png as the default fallback */}
        <img
          src={dish.img || "/tuna.png"}
          alt={dish.name}
          className="dish-img"
          onError={(e) => {
            e.currentTarget.onerror = null; // prevent error loop
            e.currentTarget.src = "/tuna.png";
          }}
        />

        <button className="view-restaurants-btn">View Restaurants with this item!</button>

        <p className="regenerate-link">
          Not interested?{" "}
          <span onClick={regenerate} style={{ cursor: "pointer", textDecoration: "underline" }}>
            Regenerate
          </span>
        </p>
      </div>

      <div className="why-section">
        <h3>
          <img src="/lightbulb.png" alt="Lightbulb" className="lightbulb-icon" /> Why this dish?
        </h3>
        <p className="why-text">{reason}</p>
      </div>

      <div className="review-section">
        <h3>Help improve our AI, leave a review!!</h3>
        <div className="stars">
          {ratings.map((value, index) => (
            <img
              key={index}
              src={value === 0 ? "/empty_star.png" : value === 1 ? "/half_rate_star.png" : "/rate_star.png"}
              alt="Star"
              className="rate-star"
              onClick={() => handleStarClick(index)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </div>
        <button onClick={submitRating} style={{ marginTop: 12 }}>
          Submit rating
        </button>
      </div>
    </div>
  );
}
