// src/pages/AIRecommendationResult.js
import React, { useEffect, useState } from "react";
import "../styles/AIRecommendationResult.css";
import { getAuth } from "firebase/auth";  

export default function AIRecommendationResult() {
  const [ctx, setCtx] = useState(null); // { data:{dish,reason,source}, prompt, likes, restrictions, excludeIds? }
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);            // ommitted rating value (0..5)
  const [hoverRating, setHoverRating] = useState(null); // live preview while hovering
  const [regenLoading, setRegenLoading] = useState(false);
  const [resolvedImg, setResolvedImg] = useState(null);
  const AI_HISTORY_KEY = "yn_ai_rec_history_v1";
  const [sendCopyToUser, setSendCopyToUser] = useState(false);


   // review inputs
  const [comment, setComment] = useState("");
  const tagChoices = ["great match", "missing ingredient", "not my craving", "too spicy", "diet conflict", "bland"];
  const [selectedTags, setSelectedTags] = useState([]);

  const [submitState, setSubmitState] = useState({ status: "idle", msg: "" }); // "idle" | "saving" | "success" | "error"

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_last_rec");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Enforce AI-only
        if (parsed?.data?.source === "ai") {
          setCtx(parsed);
          addAiRecToHistory(parsed);
        } else {
          console.warn("Blocked non-AI source in saved rec");
          localStorage.removeItem("ai_last_rec");
        }
      }
    } catch {
      // ignore bad JSON
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
  
    async function resolve() {
      const d = ctx?.data?.dish;
      if (!d) return;
  
      // Use any image the dish already has
      const direct =
        d.img ||
        d.imageUrl ||
        d.image_url ||
        d.photoUrl ||
        d.photo_url ||
        d.photo?.images?.large?.url ||
        d.images?.large?.url;

        const isHttp = typeof direct === "string" && /^https?:\/\//i.test(direct);
        const isLocal = typeof direct === "string" && /^\/(?!\/)/.test(direct);

        // If it looks like a real external URL, verify it actually loads.
        // If it fails, continue on to Unsplash fetch instead of returning.
        if (isHttp && !isLocal) {
          try {
            const ok = await new Promise((resolveProbe) => {
              const probe = new Image();
              probe.onload = () => resolveProbe(true);
              probe.onerror = () => resolveProbe(false);
              probe.src = direct;
            });
            if (ok) {
              if (!cancelled) setResolvedImg(direct);
              return; // valid external URL, we're done
            }
          } catch {
            // fall through to Unsplash
          }
        }
  
      // Ask the backend to find an Unsplash image
      const qs = new URLSearchParams({
        name: d.name || "",
        cuisine: d.cuisine || "",
        category: d.category || d.cuisine || "food",
        seed: d.id || d.name || ""
      }).toString();
  
      try {
        console.log("→ fetching dish image:", `http://localhost:5001/api/images/dish?${qs}`);
        const resp = await fetch(`http://localhost:5001/api/images/dish?${qs}`);
        if (!resp.ok) throw new Error("image fetch failed");
        const { url } = await resp.json();
        if (!cancelled) setResolvedImg(url || "/tuna.png");
      } catch {
        if (!cancelled) setResolvedImg("/tuna.png");
      }
    }
  
    resolve();
    return () => { cancelled = true; };
  }, [ctx]);
  

  if (!ctx) {
    return (
      <div className="ai-result-page" style={{ padding: 24 }}>
        No valid AI recommendation yet. Go back and try again.
      </div>
    );
  }
  

  const {
    data: { dish, reason },
    prompt,
    likes,
    restrictions,
  } = ctx;

  const recUrl = `/api/ai/recommend`;
  const rateUrl = `/api/ai/rate`;

  // helper to decide which star image to show at an index (0..4) for a value (0..5)
  function starKindAt(index, value) {
    const fullThreshold = index + 1;
    const halfThreshold = index + 0.5;
    if (value >= fullThreshold) return "full";
    if (value >= halfThreshold) return "half";
    return "empty";
  }

  // map pointer/touch position inside a star to 0.5 or 1.0 for that star
  function valueFromPointer(e, index) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? rect.left;
    const offsetX = Math.max(0, Math.min(rect.width, x - rect.left));
    const half = offsetX < rect.width / 2 ? 0.5 : 1.0;
    return index + half; // 0.5, 1.0, 1.5, ..., 5.0
  }

  function addAiRecToHistory(ctx) {
    try {
      const d = ctx?.data?.dish;
      if (!d) return;
      const item = {
        id: d.id || `${d.name}-${Date.now()}`,
        name: d.name,
        cuisine: d.cuisine || "",
        imageUrl:
          d.img || d.imageUrl || d.image_url || d.photoUrl || d.photo_url || null,
        ts: Date.now(),
      };
      const list = JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || "[]");
      const next = [item, ...list.filter((x) => x.name !== item.name)].slice(0, 25);
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  function onStarMove(e, index) {
    setHoverRating(valueFromPointer(e, index));
  }
  function onStarLeave() {
    setHoverRating(null);
  }
  function onStarClick(e, index) {
    setRating(valueFromPointer(e, index));
  }

  // tag toggle helper
  function toggleTag(t) {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function submitRating() {
    if (submitState.status === "saving") return; // prevent double submit
    if (!rating) {
      setSubmitState({
        status: "error",
        msg: "Please choose a rating before submitting.",
      });
      setTimeout(() => setSubmitState({ status: "idle", msg: "" }), 2500);
      return;
    }
  
    try {
      setSubmitState({ status: "saving", msg: "" });
  
      // 1) Get Firebase user + token FIRST
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        setSubmitState({
          status: "error",
          msg: "Please sign in to submit a review.",
        });
        setTimeout(() => setSubmitState({ status: "idle", msg: "" }), 2500);
        return;
      }
  
      // 2) Now it's safe to use user.email in the payload
      const payload = {
        dishId: dish.id,
        dishName: dish.name,
        rating,
        prompt,
        likes,
        restrictions,
        reason,
        comment,
        tags: selectedTags,
        model: "gpt-4o-mini",
        sendCopyToUser,
        userEmail: user.email,
      };
  
      const token = await user.getIdToken();
      const r = await fetch(rateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!r.ok) {
        if (r.status === 401) {
          throw new Error("unauthorized");
        }
        throw new Error("save failed");
      }
  
      setSubmitState({
        status: "success",
        msg: "Thanks! Your rating was submitted.",
      });
      setComment("");
      setSelectedTags([]);
      setTimeout(
        () => setSubmitState({ status: "idle", msg: "" }),
        2500
      );
    } catch (e) {
      console.error("submitRating failed:", e);
      setSubmitState({
        status: "error",
        msg:
          e.message === "unauthorized"
            ? "Session expired. Please sign in again to submit a review."
            : "Could not save rating right now.",
      });
      setTimeout(() => setSubmitState({ status: "idle", msg: "" }), 2500);
    }
  }
  
  


  async function regenerate() {
    try {
      if (regenLoading) return;
      setRegenLoading(true);
      const excludeIds = [dish.id, ...(ctx.excludeIds || [])];
      const res = await fetch(recUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, likes, restrictions, excludeIds }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to regenerate");
      }

      const data = await res.json();

      // Enforce AI-only
      if (data.source !== "ai") {
        throw new Error("Blocked non-AI recommendation");
      }

      const next = { ...ctx, data, excludeIds, ts: Date.now() };
      localStorage.setItem("ai_last_rec", JSON.stringify(next));
      setCtx(next);
      addAiRecToHistory(next); // add to history
    } catch (err) {
      console.error(err);
      alert("Something went wrong talking to backend. Keeping current dish.");
    } finally {
      setRegenLoading(false);
    }
  }

  // Build restaurant search query 
  function buildRestaurantQuery(dish) {
    const name = (dish?.name || "").toLowerCase();
    const ings = (dish?.ingredients || []).map(s => s.toLowerCase());
    const cuisine = (dish?.cuisine || "").toLowerCase();
    const words = new Set([
      ...name.split(/\W+/),
      ...ings.flatMap(s => s.split(/\W+/)),
      ...(cuisine ? [cuisine] : []),
    ]);
    const stop = new Set(["the","and","with","dish","meal","food","style","classic","fresh"]);
    const tokens = [...words].filter(t => t && t.length > 2 && !stop.has(t));
    const prefs = ["sushi","ramen","tacos","bbq","pizza","burger","noodle","thai","indian","mexican","italian","poke"];
    return prefs.find(p => tokens.includes(p)) || tokens[0] || "restaurant";
  }

  async function onViewRestaurantsClick(dish) {
    const loc = JSON.parse(localStorage.getItem("yn_prefs_v0") || "{}")?.location || {};
    let { latitude, longitude } = loc;

    if ((latitude == null || longitude == null) && "geolocation" in navigator) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // leave undefined
      }
    }

    const q = buildRestaurantQuery(dish);
    const qs = new URLSearchParams({
      dish: dish.name,
      q,
      ...(latitude != null && longitude != null
        ? { lat: String(latitude), lng: String(longitude) }
        : {}),
    });
    window.location.href = `/restaurants?${qs.toString()}`;
  }

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

        <p className="dish-title">{dish.name}</p>

        <img
          src={resolvedImg || dish.img || "/tuna.png"}
          alt={dish.name}
          className="dish-img"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/tuna.png"; }}
        />

        <button className="view-restaurants-btn" onClick={() => onViewRestaurantsClick(dish)}>
          View Restaurants with this item!
        </button>
        <p className="regenerate-link">
          Not interested?{" "}
          <span onClick={regenerate}>{regenLoading ? "Regenerating..." : "Regenerate"}</span>
        </p>
      </div>

      <div className="why-section">
        <h3><img src="/lightbulb.png" alt="Lightbulb" className="lightbulb-icon" /> Why this dish?</h3>
        <p className="why-text">{reason}</p>
      </div>

      <div className="review-section">
        <h3>Help improve our AI, leave a review!!</h3>

        <div className="review-stars">
          {[0,1,2,3,4].map((i) => {
            const current = hoverRating ?? rating;
            const kind = starKindAt(i, current);
            const src = kind === "full" ? "/rate_star.png" : kind === "half" ? "/half_rate_star.png" : "/empty_star.png";
            return (
              <img
                key={i}
                src={src}
                alt={`${i+1} star${i ? "s" : ""}`}
                className="rate-star star-clickable"
                onMouseMove={(e) => onStarMove(e, i)}
                onMouseLeave={onStarLeave}
                onClick={(e) => onStarClick(e, i)}
                onTouchStart={(e) => onStarClick(e, i)}
              />
            );
          })}
          <span className="review-rating-value">
            {(hoverRating ?? rating) ? `${hoverRating ?? rating} / 5` : ""}
          </span>
        </div>

        <div className="chips">
          {tagChoices.map(t => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`chip ${selectedTags.includes(t) ? "is-selected" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          className="review-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what you thought about this recommendation..."
        />

        <div className="review-email-copy">
          <label className="review-email-label">
            <input
              type="checkbox"
              className="review-email-checkbox"
              checked={sendCopyToUser}
              onChange={(e) => setSendCopyToUser(e.target.checked)}
            />
            <span className="review-email-text">
              Email me a copy of this review
              <span className="review-email-subtext">
                We’ll send it to the email on your YumNom account.
              </span>
            </span>
          </label>
        </div>

        {submitState.status !== "idle" && (
          <div className={`review-banner ${submitState.status}`}>
            {submitState.msg ||
              (submitState.status === "saving" ? "Submitting…" : "")}
          </div>
        )}

        <button
          onClick={submitRating}
          className="review-submit-btn"
          disabled={submitState.status === "saving"}
        >
          {submitState.status === "saving" ? "Submitting…" : "Submit rating"}
        </button>
      </div>
    </div>
  );
}