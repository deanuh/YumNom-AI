// src/components/Dashboard/DashboardHeader.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe } from "../../userapi/meApi";
import "../../styles/Dashboard.css";

const pickNiceName = (me) => {
  if (!me) return null;
  return (
    me.displayName ||
    me.first_name ||
    me.username ||
    me.name ||
    (me.email ? me.email.split("@")[0] : null)
  );
};

const timeOfDay = (d = new Date()) => {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const PHRASES = [
  "ready to discover something tasty?",
  "let’s find a new favorite dish today.",
  "your cravings called—let’s answer them.",
  "how about something bold and delicious?",
  "hungry for ideas? i’ve got plenty.",
  "let’s cook up the perfect recommendation.",
  "i’ve saved you a seat at flavor town.",
  "let’s make choosing what to eat effortless.",
];

const nextPhrase = () => {
  const key = "dashGreetingIndex";
  const current = Number(sessionStorage.getItem(key) || 0);
  const next = (current + 1) % PHRASES.length;
  sessionStorage.setItem(key, String(next));
  return PHRASES[current];
};

const buildGreeting = (name) => {
  const friendlyName = name || "friend";
  const salutation = timeOfDay();
  const phrase = nextPhrase();
  return `${salutation}, ${friendlyName} — ${phrase}`;
};

function HowItWorksCarousel({ onGoProfile, onGoAI }) {
  const [i, setI] = useState(0);
  const PUB = process.env.PUBLIC_URL || "";

  const slides = [
    {
      title: "How YumNom AI Dish recommendations work!",
      body: "",
      img: null,
      actions: [],
    },
    {
      title: "1) Set up your Profile",
      body:
        "Go to User Profile → add dietary restrictions, allergies, dislikes, and budget. This lets us personalize every dish.",
      img: `${PUB}/nav_userprofile.png`,
    },
    {
      title: "2) Open AI Dish Recommendation",
      body:
        "Use the left navbar → AI Recommendation. You can tweak restrictions or preferences here just for this session.",
      img: `${PUB}/nav_rest.png`,
    },
    {
      title: "3) Tell us your craving",
      body:
        "Type something like “spicy chicken”, “light & high-protein”, or “creamy pasta, no mushrooms”, then submit.",
      img: `${PUB}/craving_input.png`,
    },
    {
      title: "4) Review, regenerate, or save",
      body:
        "We’ll explain why we chose it. Not into it? Hit regenerate. Love it? Save & leave a quick review.",
      img: `${PUB}/review.png`,
    },
    {
      title: "5) Find it nearby",
      body:
        "Browse restaurants that may have your recommended dish and pick a spot. Adjust preferences anytime.",
      img: `${PUB}/restruant_button.png`,
    },
  ];

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const s = slides[i];
  const isFirstSlide = i === 0;

  return (
    <section
      className={`howit-card ${isFirstSlide ? "first-slide" : ""}`}
      aria-label="how AI dish recommendation works"
    >
      <header className="howit-header">
        <h3>{s.title}</h3>
      </header>

      {s.body && <p className="howit-body">{s.body}</p>}
      {s.img && <img src={s.img} alt="" className="howit-img" />}

      {s.actions?.length > 0 && (
        <div className="howit-actions">
          {s.actions.map((a, idx) => (
            <button key={idx} className="howit-cta" onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="howit-dots" role="tablist" aria-label="slides">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === i ? "active" : ""}`}
            aria-label={`slide ${idx + 1}`}
            aria-selected={idx === i}
            onClick={() => setI(idx)}
          />
        ))}
      </div>
    </section>
  );
}

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [personalGreeting, setPersonalGreeting] = useState("Loading…");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await fetchMe();
        const nice = pickNiceName(me);
        if (!alive) return;
        setPersonalGreeting(buildGreeting(nice));
      } catch {
        if (!alive) return;
        setPersonalGreeting(buildGreeting(null));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const greeting = useMemo(() => (loading ? "Loading…" : personalGreeting), [
    loading,
    personalGreeting,
  ]);

  return (
    <div className="dashboard-header">
      <h1 className="dash-greeting">{greeting}</h1>

      {/* two-column row: banner + carousel */}
      <div className="dash-row">
        {/* left: hero banner card */}
        <div
          className="dashboard-banner is-gradient"
          role="region"
          aria-label="Personal food journey"
        >
          <div className="banner-text">
            <h2>Start your personal food journey</h2>
            <p>AI-Powered Dish Recommendations Made Just for You.</p>
          </div>
          <button
            className="banner-button"
            type="button"
            onClick={() => navigate("/ai-recommendation")}
          >
            GET STARTED
          </button>
        </div>

        {/* right: how-it-works carousel */}
        <HowItWorksCarousel
          onGoProfile={() => navigate("/user/profile")}
          onGoAI={() => navigate("/ai-recommendation")}
        />
      </div>

      <div className="edit-note" aria-live="polite">
        <span className="edit-text">Edit your Dashboard to your liking!</span>
        <img src="/edit_icon.png" alt="Edit" className="edit-img" />
      </div>

      <div className="your-dash">
        <h1>Your Personalized Dashboard!</h1>
      </div>
    </div>
  );
};

export default DashboardHeader;
