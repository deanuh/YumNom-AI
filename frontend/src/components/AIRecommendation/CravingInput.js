// components/AIRecommendation/CravingInput.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// normalize helper (lowercase, trim, dedupe)
const norm = (arr = []) =>
  Array.from(new Set((arr || []).map(s => String(s).toLowerCase().trim())));

/**
 * Component: CravingInput
 * - Allows the user to enter a craving prompt (free text).
 * - Sends request to backend AI recommendation endpoint.
 * - Stores result in localStorage for later retrieval by result page.
 * - Redirects user to "/ai-result" after successful response.
 *
 * Props:
 *  - likes: array of user’s preferred items
 *  - restrictions: array of items user cannot have
 */

export default function CravingInput({ likes = [], restrictions = [] }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

/**
   * Handle form submission:
   * - Build payload with prompt, likes, and restrictions
   * - POST to /api/ai/recommend
   * - If valid, save to localStorage and navigate to results page
   */

  async function handleSubmit() {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const payload = {
      prompt,
      likes: norm(likes),
      restrictions: norm(restrictions),
    };

    setLoading(true);
    try {
      // Call backend AI recommendation route
      const res = await fetch(`/api/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get recommendation");
      }

      const data = await res.json();
      // Ensure response came from AI system (not fallback)
      if (data.source !== "ai") {
        throw new Error("Blocked non-AI recommendation");
      }

      // Save to localStorage for retrieval in results page
      localStorage.setItem(
        "ai_last_rec",
        JSON.stringify({
          data,
          prompt: payload.prompt,
          likes: payload.likes,
          restrictions: payload.restrictions,
          ts: Date.now(),
        })
      );
      // Reset input and navigate to result page
      setInput("");
      navigate("/ai-result");
    } catch (err) {
      alert(`AI recommend error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

   /**
   * Handle Enter key press to trigger submit.
   */
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
