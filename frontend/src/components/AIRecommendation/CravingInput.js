import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CravingInput({ likes = [], restrictions = [] }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit() {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, likes, restrictions })
      });
      if (!res.ok) throw new Error("Failed to get recommendation");
      const data = await res.json(); // { dish, reason }

      localStorage.setItem(
        "ai_last_rec",
        JSON.stringify({ data, prompt, likes, restrictions })
      );

      setInput("");
      navigate("/ai-result");
    } catch (err) {
      alert(`AI recommend error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

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
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={handleSubmit} disabled={loading}>
          <img src="/ai_icon.png" alt="sparkle icon" className="an-craving-icon" />
        </button>
      </div>
    </div>
  );
}
