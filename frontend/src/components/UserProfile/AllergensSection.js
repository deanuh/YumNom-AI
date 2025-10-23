import React, { useState} from "react";
import "../../styles/UserProfile.css";
import { getIconFile, overlayText, normalize } from "../shared/icons";

// storage key: lowercase + underscores
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

const AllergensSection = ({ me, onSave = async () => {} }) => {
  // define current state FIRST
  const diet =
    (me && me.diet && typeof me.diet === "object")
      ? me.diet
      : { types: [], allergens: [] };

  const allergens = Array.isArray(diet.allergens) ? diet.allergens : [];
  const types     = Array.isArray(diet.types)     ? diet.types     : [];

  // always merge against the CURRENT me.diet to avoid stale/undefined vars
  const saveDiet = async (next) => {
    const current = me?.diet || { types: [], allergens: [] };
    const payload = { diet: { ...current, ...next } };
    console.log("[AllergensSection] onSave payload →", payload);
    await onSave(payload);
  };
  

  // Allergens handlers
  const addAllergen = async (key) => {
    const set = new Set(allergens);
    set.add(key);
    await saveDiet({ allergens: Array.from(set) });
  };
  const removeAllergen = async (key) => {
    await saveDiet({ allergens: allergens.filter((a) => a !== key) });
  };
// sort for stable UI
  const sortedAllergens = [...allergens].sort();
  const sortedTypes = [...types].sort();

  // local UI state for showing the add input rows
  const [addingAllergen, setAddingAllergen] = useState(false);
  const [addingType, setAddingType] = useState(false);

  // Types handlers
  const addType = async (key) => {
    const set = new Set(types);
    set.add(key);
    await saveDiet({ types: Array.from(set) });
  };
  const removeType = async (key) => {
    await saveDiet({ types: types.filter((t) => t !== key) });
  };

  return (
    <div className="inline-section">
      <h4>Dietary Preferences</h4>

      <div className="white-box">
        <div className="dietary-two-column">

          {/* Allergens (account-level) */}
          <div className="dietary-column">
            <p><strong>Allergens</strong></p>
            <div className="preference-icons">
              {sortedAllergens.map((a) => (
                <Pill key={`allergen-${a}`} label={a} onRemove={removeAllergen} />
              ))}

              {!addingAllergen ? (
                <div
                  className="pill-icon add-pill"
                  role="button"
                  tabIndex={0}
                  onClick={() => setAddingAllergen(true)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setAddingAllergen(true) : null)}
                  title="Add Allergen"
                >
                  <div className="pill-circle">
                    <img src="/add_pref_icon.png" alt="" aria-hidden="true" />
                  </div>
                  <span className="pill-label">Add Allergen</span>
                </div>
              ) : (
                <AddRow
                  placeholder="Add allergen (e.g., sesame)"
                  onAdd={addAllergen}
                  onCancel={() => setAddingAllergen(false)}
                />
              )}
            </div>
          </div>

          <div className="dietary-divider" />

          {/* Diet types (account-level) */}
          <div className="dietary-column">
            <p><strong>Dietary Preference</strong></p>
            <div className="preference-icons">
              {sortedTypes.map((t) => (
                <Pill key={`type-${t}`} label={t} onRemove={removeType} />
              ))}

              {!addingType ? (
                <div
                  className="pill-icon add-pill"
                  role="button"
                  tabIndex={0}
                  onClick={() => setAddingType(true)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setAddingType(true) : null)}
                  title="Add Preference"
                >
                  <div className="pill-circle">
                    <img src="/add_pref_icon.png" alt="" aria-hidden="true" />
                  </div>
                  <span className="pill-label">Add Preference</span>
                </div>
              ) : (
                <AddRow
                  placeholder="Add preference (e.g., vegan, gluten_free)"
                  onAdd={addType}
                  onCancel={() => setAddingType(false)}
                />
              )}
            </div>
          </div>
        </div>

        <p style={{ marginTop: 12, color: "#6e558e"}}>
          Saved to your account. AI Dish Rec will use these by default.
        </p>
      </div>
    </div>
  );
};

export default AllergensSection;
