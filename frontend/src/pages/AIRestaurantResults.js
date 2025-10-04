// src/pages/AIRestaurantResults.js
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/AIRestaurantResults.css";

// Reuse existing utilities/components from your Restaurant Search
import DishCard from "../components/Dashboard/DishCard";
import { getUserCity } from "../components/GetUserLoc";
import { getRestaurant } from "../components/GetRestaurant";

const DEFAULT_RADIUS_MI = 10;
const DEFAULT_UNITS = "mi";

// ---- helpers copied from RestaurantSearch ----
const formatDistance = (d) =>
  typeof d === "number" ? `${d.toFixed(1)} mi` : d ? `${Number(d).toFixed(1)} mi` : "";

const formatAddress = (r) =>
  r.address_string ||
  [r.street1 || r.street || r.address, r.city, r.state, r.postcode || r.postalcode]
    .filter(Boolean)
    .join(", ");

/**
 * Extract keyword tokens from dish/cuisine/ingredients
 * Used for matching restaurants more accurately.
 */

function tokensFrom(dishName, ingredients, cuisine) {
  const words = new Set([
    ...(dishName || "").toLowerCase().split(/\W+/),
    ...(ingredients || []).map((s) => s.toLowerCase()),
    (cuisine || "").toLowerCase(),
  ]);
  const stop = new Set(["the", "and", "with", "dish", "meal", "food", "style", "classic", "fresh"]);
  return [...words].filter((t) => t && t.length > 2 && !stop.has(t));
}

/**
 * Score a restaurant relative to tokens.
 * - +2 points for each token match in name/address/category
 * - +0.5 points per rating star
 * - -0.2 penalty per km distance
 */

function scoreRestaurant(item, tokens) {
  const hay = `${item.name} ${item.address_obj?.city ?? ""} ${item.category?.key ?? ""}`.toLowerCase();
  let s = 0;
  for (const k of tokens) if (k && hay.includes(k)) s += 2;     // match boost
  if (item.rating) s += 0.5 * Number(item.rating);              // rating bonus
  if (item.distance_km) s -= 0.2 * Number(item.distance_km);    // distance penalty
  return s;
}

export default function AIRestaurantResults() {
  const [params] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationLabel, setLocationLabel] = useState("Detecting…");
  const [coords, setCoords] = useState(null); // { longitude, latitude }

  const [dish, setDish] = useState(null);
  const [results, setResults] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);

  const dishName = params.get("dish") || "";
  const qParam = params.get("q") || "";  // derived keyword from AI page (e.g., "sushi")
  const latParam = params.get("lat");
  const lngParam = params.get("lng");

  // Load full dish (hero card)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_last_rec");
      if (saved) {
        const parsed = JSON.parse(saved);
        setDish(parsed?.data?.dish || null);
      }
    } catch {}
  }, []);

  const dishTokens = useMemo(() => tokensFrom(dishName, [qParam], ""), [dishName, qParam]);

  // Resolve location: use URL params if present; else re-use RestaurantSearch's getUserCity()
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (latParam && lngParam) {
          if (!cancelled) {
            setCoords({ latitude: Number(latParam), longitude: Number(lngParam) });
            setLocationLabel("Using your saved location");
          }
          return;
        }
        const loc = await getUserCity(); // same behavior as Search page
        if (!cancelled) {
          setCoords({ latitude: loc.latitude, longitude: loc.longitude });
          setLocationLabel(`${loc.city}, ${loc.state}`);
        }
      } catch {
        if (!cancelled) {
          setCoords(null);
          setLocationLabel("Location unavailable");
          setError("Please enable location on the Search page.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [latParam, lngParam]);

  // Fetch TripAdvisor restaurants after we have coords
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!coords?.latitude || !coords?.longitude) { setLoading(false); return; }
      setLoading(true);
      setError("");
      setUsedFallback(false);

      try {
        // 1) keyword search first (e.g., "sushi")
        const data1 = await getRestaurant(
          coords.longitude,
          coords.latitude,
          DEFAULT_RADIUS_MI,
          DEFAULT_UNITS,
          (qParam || "").trim()
        );
        let list = Array.isArray(data1?.data) ? data1.data : [];

        // 2) fallback to nearby if keyword returns nothing
        if (!list.length) {
          const data2 = await getRestaurant(
            coords.longitude,
            coords.latitude,
            DEFAULT_RADIUS_MI,
            DEFAULT_UNITS,
            "" // no query → browse nearby
          );
          list = Array.isArray(data2?.data) ? data2.data : [];
          setUsedFallback(true);
        }

        const ranked = list
          .map((x) => ({ ...x, _score: scoreRestaurant(x, dishTokens) }))
          .sort((a, b) => b._score - a._score);

        if (!cancelled) setResults(ranked);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Unable to fetch restaurants.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [coords, qParam, dishTokens]);

  // Open menu/website: details → website → Google fallback
  async function openMenuWebsite(item) {
    if (item.website) { window.open(item.website, "_blank"); return; }
    try {
      const res = await fetch(`/api/restaurants/${item.location_id}`);
      if (res.ok) {
        const det = await res.json();
        if (det.website) { window.open(det.website, "_blank"); return; }
      }
    } catch {}
    const query = `${item.name} menu ${item.address_obj?.city || ""}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  }

  function openDirections(item) {
    const query = item.name + " " + (item.address_obj?.address_string || formatAddress(item));
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
  }

  function openCall(item) {
    const tel = item.phone || item.phone_number;
    if (tel) window.open(`tel:${tel}`);
  }

  return (
    <div className="restaurants-page">
      <h1 className="restaurants-title">DISH CREATED FOR YOU!</h1>
      <h2 className="restaurants-subtitle">Likely Restaurants with this Dish</h2>
      <div className="restaurants-back">
        <Link to="/ai-result">← Go back to AI Recommendation</Link>
      </div>

      {/* Hero dish */}
      <div className="restaurants-hero">
        <div className="hero-card">
          {dish ? (
            <>
              <div className="hero-name">{dish.name}</div>
              <img
                className="hero-img"
                src={dish.img || "/tuna.png"}
                alt={dish.name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/tuna.png"; }}
              />
            </>
          ) : (
            <div className="hero-placeholder">Dish</div>
          )}
        </div>
      </div>

      <div className="restaurants-hint">
        Based off AI Recommended dish: <strong>{dishName || qParam || "(none)"}</strong>
        {locationLabel ? <span> • <em>{locationLabel}</em></span> : null}
      </div>

      {loading && <div className="restaurants-loading">Loading nearby restaurants…</div>}
      {error && <div className="restaurants-empty">{error}</div>}

      {!loading && usedFallback && !error && (
        <div className="restaurants-note">
          No exact matches found for “{qParam}”. Showing popular spots nearby.
        </div>
      )}

      {!loading && !error && (
        <div className="results-grid">
          {results.map((r) => (
            <DishCard
              key={r.location_id || `${r.name}-${r.address_string}`}
              name={r.name}
              address={formatAddress(r)}
              distance={formatDistance(r.distance)}
              imageUrl={r.photoUrl || r.image_url || r.photo?.images?.large?.url || null}
              onViewMenu={() => openMenuWebsite(r)}
            />
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="restaurants-empty">No restaurants found near you.</div>
      )}
    </div>
  );
}

