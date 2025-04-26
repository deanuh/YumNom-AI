// pages/AIRecommendationResult.js
import React, { useState } from 'react';
import '../styles/AIRecommendationResult.css'; // You can create this file for styling

export default function AIRecommendationResult() {
    const [isFavorite, setIsFavorite] = useState(false); 
    const [ratings, setRatings] = useState([0, 0, 0, 0, 0]);  
    const handleStarClick = (index) => {
        setRatings((prevRatings) => {
          const newRatings = [...prevRatings];
          if (newRatings[index] === 0) {
            newRatings[index] = 1; // click once ➔ half star
          } else if (newRatings[index] === 1) {
            newRatings[index] = 2; // click again ➔ full star
          } else {
            newRatings[index] = 0; // click again ➔ empty
          }
          return newRatings;
        });
      };
    
      const getStarImage = (value) => {
        if (value === 0) return "/empty_star.png";
        if (value === 1) return "/half_rate_star.png";
        if (value === 2) return "/rate_star.png";
      };
    return (
        <div className="ai-result-page">
        <h1 className="result-title">DISH CREATED FOR YOU!</h1>
        <h2 className="result-subtitle">Your AI Dish Recommendation!</h2>
        <p className="result-desc">Based off of your preferences and chat with our AI, we think you should try…</p>

        <div className="result-card">
            <div className="heart-container">
                <img
                    src={isFavorite ? "/heart_dark.png" : "/heart.png"}
                    alt="Favorite"
                    className="heart-icon"
                    onClick={() => setIsFavorite((prev) => !prev)}
                />
                </div>

            <p className="dish-title">Really Special One-of-a-Kind Chicken Sandwich</p>
            <img src="/chicken.png" alt="AI Dish" className="dish-img" />
            <button className="view-restaurants-btn">View Restaurants with this item!</button>
            <p className="regenerate-link">Not interested? <span>Regenerate</span></p>
        </div>

        <div className="why-section">
        <h3>
            <img src="/lightbulb.png" alt="Lightbulb" className="lightbulb-icon" /> Why this dish?
        </h3>
            <p className="why-text">
            You’re in for a crispy, juicy bite! This one-of-a-kind chicken sandwich is hand-breaded to perfection
            and topped with a zesty house-made sauce. The AI picked this for you based on your love for savory
            comfort foods and bold flavors. Plus, it’s a local favorite!
            </p>
        </div>

        <div className="review-section">
            <h3>Help improve our AI, leave a review!!</h3>
            <div className="stars">
            {ratings.map((value, index) => (
                <img
                key={index}
                src={getStarImage(value)}
                alt="Star"
                className="rate-star"
                onClick={() => handleStarClick(index)}
                style={{ cursor: 'pointer' }}
                />
            ))}
        </div>
        </div>
        </div>
    );
    }
