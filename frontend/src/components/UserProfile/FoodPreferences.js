// src/components/UserProfile/FoodPreferences.js
import React, { useMemo, useState } from "react";
import "../../styles/UserProfile.css";
import { getIconFile, overlayText, normalize } from "../shared/icons";

// helpers
const toKey = (s) => normalize(s).replace(/\s+/g, "_");
const pretty = (s) => String(s || "").replace(/_/g, " ");

function Pill({ label, onRemove }) {
  const iconFile = getIconFile(label);
  const hasIcon = Boolean(iconFile);
  const src = `/${hasIcon ? iconFile : "empty_icon.png"}`;
  return (
    <div className="pill-icon" title={pretty(label)} aria-label={pretty(label)}>
      <div className="pill-circle">
        <img src={src} alt={pretty(label)} />
        {!hasIcon && <span className="pill-internal-text">{overlayText(label)}</span>}
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



const FoodPreferences = ({ me, onSave = async () => {} }) => {
  // current exclusions → ingredients array
  const exclusions = (me && me.exclusions) || { ingredients: [], items: [] };
  const ingredients = Array.isArray(exclusions.ingredients) ? exclusions.ingredients : [];

  const sorted = useMemo(() => [...ingredients].sort(), [ingredients]);

  // persist helper merges into existing exclusions payload
  const saveIngredients = async (arr) => {
    const current = me?.exclusions || { ingredients: [], items: [] };
    await onSave({
      exclusions: {
        ...current,
        ingredients: arr,
      },
    });
  };

  const [adding, setAdding] = useState(false);

  // handlers
  const addIngredient = async (key) => {
    const set = new Set(ingredients);
    set.add(key);
    await saveIngredients(Array.from(set));
  };

  const removeIngredient = async (key) => {
    await saveIngredients(ingredients.filter((x) => x !== key));
  };

  return (
    <div className="inline-section">
      <h4>Do not recommend these ingredients</h4>

      <div className="white-cont">
        <div className="dietary-pill-container">
          {/* existing ingredients */}
          {sorted.map((k) => (
            <Pill key={`ex-${k}`} label={k} onRemove={removeIngredient} />
          ))}

          

          {/* “Add Ingredient” free-text */}
          {!adding ? (
            <div
              className="pill-icon add-pill"
              role="button"
              tabIndex={0}
              onClick={() => setAdding(true)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setAdding(true) : null)}
              title="Add Ingredient"
            >
              <div className="pill-circle">
                <img src="/add_pref_icon.png" alt="" aria-hidden="true" />
              </div>
              <span className="pill-label">Add Ingredient</span>
            </div>
          ) : (
            <AddRow
              placeholder="Add ingredient (e.g., peanut, cilantro)"
              onAdd={addIngredient}
              onCancel={() => setAdding(false)}
            />
          )}
        </div>
        <p style={{ marginTop: 12, color: "var(--text-hint-colored)" }}>
          Saved to your profile. AI recommendations will exclude dishes containing these.
        </p>
      </div>
    </div>
  );
};

export default FoodPreferences;
