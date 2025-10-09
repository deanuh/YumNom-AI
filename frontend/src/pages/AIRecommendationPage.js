// src/pages/AIRecommendationPage.js
import React, { useEffect, useMemo, useState } from "react";
import "../styles/AIRecommendation.css";
import UserPreferences from "../components/AIRecommendation/UserPreferences";
import CravingInput from "../components/AIRecommendation/CravingInput";
import ChatBot from "./ChatBot";


const LS_KEY = "yn_prefs_v0";
const normalize = (list = []) =>
  Array.from(new Set(list.map(s => String(s).toLowerCase().trim()))).filter(Boolean);

export default function AIRecommendationPage() {
  const [showChat, setShowChat] = useState(false);
  const toggleChat = () => setShowChat(v => !v);

  // ---- preferences state (REAL data, not hard-coded)
  const [prefs, setPrefs] = useState({ likes: [], restrictions: [] });

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs({
          likes: normalize(parsed.likes || []),
          restrictions: normalize(parsed.restrictions || []),
        });
      }
    } catch (_) {
      // ignore bad JSON
    }
  }, []);

  // persist whenever prefs change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // handlers passed to the UI component
  const addLike = (s) =>
    setPrefs(p => ({ ...p, likes: normalize([...(p.likes || []), s]) }));
  const removeLike = (s) =>
    setPrefs(p => ({ ...p, likes: (p.likes || []).filter(x => x !== s) }));

  const addRestriction = (s) =>
    setPrefs(p => ({ ...p, restrictions: normalize([...(p.restrictions || []), s]) }));
  const removeRestriction = (s) =>
    setPrefs(p => ({ ...p, restrictions: (p.restrictions || []).filter(x => x !== s) }));

  const likes = useMemo(() => prefs.likes || [], [prefs.likes]);
  const restrictions = useMemo(() => prefs.restrictions || [], [prefs.restrictions]);

  return (
    <div className="ai-recommendation-container">
      <h1 className="title">AI-POWERED DISH RECOMMENDATIONS MADE JUST FOR YOU.</h1>
      <p className="subtitle">Here is what our AI model knows about you!</p>

      <div className="preferences-section">
        <UserPreferences
          likes={likes}
          restrictions={restrictions}
          onAddLike={addLike}
          onRemoveLike={removeLike}
          onAddRestriction={addRestriction}
          onRemoveRestriction={removeRestriction}
        />
      </div>

      {/* IMPORTANT: CravingInput is where the AI call happens.
          Make sure it only accepts responses with source: "ai". */}
      <CravingInput likes={likes} restrictions={restrictions} />

      <button className="chat-toggle-button" onClick={toggleChat}>
        Chat with NOMBOT
        <img src="/nombot_white.png" alt="NOMBOT Icon" className="nombot-icon" />
      </button>

      {showChat && <ChatBot toggleChat={toggleChat} />}
    </div>
  );
}
