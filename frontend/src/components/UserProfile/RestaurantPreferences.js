// src/components/UserProfile/RestaurantPreferences.js
import React, { useMemo, useState } from "react";
import "../../styles/UserProfile.css";
import { normalize, overlayText } from "../shared/icons"; // same util used in FoodPreferences

// helpers to mirror FoodPreferences behavior
const toKey = (s) => normalize(s).replace(/\s+/g, "_");
const pretty = (s) => String(s || "").replace(/_/g, " ");

function Pill({ label, onRemove }) {
  // Restaurants usually won’t have brand icons in your set; render a letter chip + “×”
  return (
    <div className="pill-icon" title={pretty(label)} aria-label={pretty(label)}>
      <div className="pill-circle">
        <img src="/empty_icon.png" alt={pretty(label)} />
        <span className="pill-internal-text">{overlayText(label)}</span>
        <button
          type="button"
          className="pill-remove"
          aria-label={`Remove ${pretty(label)}`}
          onClick={() => onRemove(label)}
        >
          ×
        </button>
      </div>
      <span className="pill-label">{pretty(label)}</span>
    </div>
  );
}

function AddRow({ placeholder, onAdd, onCancel }) {
  const [text, setText] = useState("");
  const add = () => {
    const v = toKey(text);
    if (!v) return;
    onAdd(v);
    setText("");
    onCancel();
  };
  return (
    <div className="pill-add-row">
      <img src="/add_pref_icon.png" alt="" aria-hidden="true" className="pill-add-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.key === "Enter" ? add() : null)}
      />
      <button type="button" className="btn-primary" onClick={add}>Add</button>
      <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default function RestaurantPreferences({ me, onSave = async () => {} }) {
  const exclusions = (me && me.exclusions) || { ingredients: [], items: [] };
  const items = Array.isArray(exclusions.items) ? exclusions.items : [];

  const sorted = useMemo(() => [...items].sort(), [items]);

  // persist helper merges into existing exclusions
  const saveItems = async (arr) => {
    const current = me?.exclusions || { ingredients: [], items: [] };
    await onSave({
      exclusions: {
        ...current,
        items: arr,
      },
    });
  };

  const [adding, setAdding] = useState(false);

  const addRestaurant = async (key) => {
    const set = new Set(items);
    set.add(key);
    await saveItems(Array.from(set));
  };

  const removeRestaurant = async (key) => {
    await saveItems(items.filter((x) => x !== key));
  };

  return (
    <div className="inline-section">
      <h4>Do not recommend these restaurants</h4>

      <div className="white-cont">
        <div className="dietary-pill-container">
          {/* Empty state message like your screenshot */}
          {sorted.length === 0 && (
            <div className="dietary-pill-hint">
            </div>
          )}

          {/* existing excluded restaurants */}
          {sorted.map((k) => (
            <Pill key={`ex-rest-${k}`} label={k} onRemove={removeRestaurant} />
          ))}

          {/* “Add Restaurant” free-text (same UX as FoodPreferences) */}
          {!adding ? (
            <div
              className="pill-icon add-pill"
              role="button"
              tabIndex={0}
              onClick={() => setAdding(true)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setAdding(true) : null)}
              title="Add Restaurant"
            >
              <div className="pill-circle">
                <img src="/add_pref_icon.png" alt="" aria-hidden="true" />
              </div>
              <span className="pill-label">Add Restaurant</span>
            </div>
          ) : (
            <AddRow
              placeholder="Add restaurant (e.g., McDonald's, Starbucks)"
              onAdd={addRestaurant}
              onCancel={() => setAdding(false)}
            />
          )}
        </div>

        <p style={{ marginTop: 12, color: "var(--text-hint-colored)" }}>
          Saved to your profile. Restaurant Search and AI recommendations will exclude these.
        </p>
      </div>
    </div>
  );
}
