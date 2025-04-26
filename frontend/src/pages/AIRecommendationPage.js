import React from "react";
import "../styles/AIRecommendation.css";
import UserPreferences from '../components/AIRecommendation/UserPreferences';
import CravingInput from '../components/AIRecommendation/CravingInput';

export default function AIRecommendationPage() {

  return (
    <div className="ai-recommendation-container">
      <h1 className="title">AI-POWERED DISH RECOMMENDATIONS MADE JUST FOR YOU.</h1>
      <p className="subtitle">Here is what our AI model knows about you!</p>

      <div className="preferences-section">
        <UserPreferences />
      </div>

      <CravingInput />

    </div>
  );
}
