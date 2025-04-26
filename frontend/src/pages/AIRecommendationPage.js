import React from "react";
import { useState } from "react";
import "../styles/AIRecommendation.css";
import UserPreferences from '../components/AIRecommendation/UserPreferences';
import CravingInput from '../components/AIRecommendation/CravingInput';
import ChatBot from "./ChatBot";


export default function AIRecommendationPage() {
  const [showChat, setShowChat] = useState(false);

  const toggleChat = () => {
    setShowChat(prev => !prev);
  };

  return (
    <div className="ai-recommendation-container">
      <h1 className="title">AI-POWERED DISH RECOMMENDATIONS MADE JUST FOR YOU.</h1>
      <p className="subtitle">Here is what our AI model knows about you!</p>

      <div className="preferences-section">
        <UserPreferences />
      </div>

      <CravingInput />
      {/* Button inside normal page flow */}
      <button className="chat-toggle-button" onClick={toggleChat}>
        Chat with YumNom AI
      </button>


      {/* Show ChatBot component if open */}
      {showChat && <ChatBot toggleChat={toggleChat} />}
    </div>
  );
}
