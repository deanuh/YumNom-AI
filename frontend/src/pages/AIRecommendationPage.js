// src/pages/AIRecommendationPage.js
import React, { useEffect, useMemo, useState } from "react";
import "../styles/AIRecommendation.css";
import UserPreferences from "../components/AIRecommendation/UserPreferences";
import CravingInput from "../components/AIRecommendation/CravingInput";
import ChatBot from "./ChatBot";
import { getAuth } from "firebase/auth";


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

  async function fetchMeAuthed() {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error("Not signed in (no Firebase ID token)");
    const r = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`fetchMe failed: ${r.status}`);
    return r.json();
  }
  
  // persist whenever prefs change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMeAuthed();
        const types = (me?.diet?.types || []).map(String);
        const allergens = (me?.diet?.allergens || []).map(String);
        const excluded = (me?.exclusions?.ingredients || []).map(String);
        const mergedRestrictions = normalize([...types, ...allergens, ...excluded]);
        if (!cancelled) {
          setPrefs(p => ({
            likes: normalize(p.likes || []),
            restrictions: normalize([...(p.restrictions || []), ...mergedRestrictions]),
          }));
        }
      } catch (e) {
        console.warn("hydrate /api/me failed:", e?.message || e);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  

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
