// components/CravingInput.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function CravingInput({ onSubmit }) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (input.trim()) {
      setInput('');
      navigate('/ai-result'); // just navigate directly!
    }
  };
  
  


  return (
    <div className="craving-section">
      <h2>Tell us what you’re in the mood for?</h2>
      <img src="/ai_icon.png" alt="sparkle icon" className="craving-icon" />
      <div className="craving-input-box">
        <input
          type="text"
          placeholder="What are you craving?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleSubmit}>
          <img src="/ai_icon.png" alt="sparkle icon" className="an-craving-icon" />
        </button>
      </div>
    </div>
  );
}
