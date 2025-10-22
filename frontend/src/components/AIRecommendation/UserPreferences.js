// components/AIRecommendation/UserPreferences.js
import React, { useState, useMemo } from "react";
import { getIconFile, overlayText } from "../shared/icons";
// const ICONS = {
//   //common allergies
//   avocado: "avacado_allergy.png",
//   mushroom: "mushroom_allergy.png",
//   egg: "egg_allergy.png",
//   //rice
//   //potato
//   //corn
//   //mango

//   peanut: "nut_allergy.png",
//   soy: "nut_allergy.png",
//   nut: "nut_allergy.png",
//   treenut:"nut_allergy.png",
//   sesame:"nut_allergy.png",
//   walnut: "nut_allergy",
//   pecan: "nut_allergy.png",

//   fish: "fish_allergy.png",
//   shellfish: "shell_fish.png",

//   dairy: "dairy.png",
//   milk: "dairy.png",
//   cheese: "cheese.png",
//   gluten: "glutten_free.png",
//   wheat:"glutten_free.png",

//   pork: "meat.png",
//   beef: "meat.png",
//   meat: "meat.png",
//   chicken: "chicken_leg.png",

//   vegan: "vegatarian.png",
//   vegetarian: "vegatarian.png",
//   kosher: "kosher.png",
//   halal: "halal.png",
// };

// // helper: normalize & resolve icon
// const normalize = (s) => String(s || "").toLowerCase().trim();

// /**
//  * Resolve an icon file for a given label.
//  * Returns null if no matching icon is found.
//  */
// const getIconFile = (label) => ICONS[normalize(label)] || null;
// /**
//  * Overlay text (shortened/uppercase version of label).
//  * Used inside pill bubble if no icon exists.
//  */
// const overlayText = (label) => {
//   const t = normalize(label).replace(/[^a-z0-9]/g, "");
//   return (t.length <= 15 ? t : t.slice(0, 15)).toUpperCase(); // short tag inside bubble
// };
// // Component: Pill
// // Represents a single restriction/like as an icon bubble.

function Pill({ label, onRemove }) {
  const iconFile = getIconFile(label);
  const hasRealIcon = Boolean(iconFile);
  const bubbleSrc = `/${hasRealIcon ? iconFile : "empty_icon.png"}`;

  return (
    <div className="pill-icon" title={label} aria-label={label}>
      <div className="pill-circle">
        <img src={bubbleSrc} alt={label} />
        {!hasRealIcon && (
          <span className="pill-internal-text">{overlayText(label)}</span>
        )}
        <button
          type="button"
          className="pill-remove"
          aria-label={`Remove ${label}`}
          onClick={() => onRemove(label)}
        >
          ×
        </button>
      </div>
      {/* Always keep the label under the icon */}
      <span className="pill-label">{label}</span>
    </div>
  );
}

// Component: AddPill
// Represents a “+ Add” button that opens an input field.

function AddPill({ onClick, label = "Add" }) {
  return (
    <div
      className="pill-icon add-pill"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onClick() : null)}
      title={label}
    >
      <div className="pill-circle">
        <img src="/add_pref_icon.png" alt="" aria-hidden="true" />
      </div>
      <span className="pill-label">{label}</span>
    </div>
  );
}

// Component: UserPreferences
// Main wrapper for managing Likes and Restrictions.
// - Displays pills for each entry
// - Allows adding/removing entries
// - Uses icons if available, otherwise shows overlay text
export default function UserPreferences({
  likes,
  restrictions,
  onAddLike,
  onRemoveLike,
  onAddRestriction,
  onRemoveRestriction,
}) {
  const [likeInput, setLikeInput] = useState("");
  const [restInput, setRestInput] = useState("");
  const [addingLike, setAddingLike] = useState(false);
  const [addingRest, setAddingRest] = useState(false);

  const sortedLikes = useMemo(() => [...likes].sort(), [likes]);
  const sortedRests = useMemo(() => [...restrictions].sort(), [restrictions]);

  /**
   * Helper: Add a new item
   * - Trims input
   * - Calls handler (onAddLike / onAddRestriction)
   * - Clears input and closes add mode
   */
  const add = (val, handler, clear, close) => {
    const v = String(val || "").trim();
    if (!v) return;
    handler(v);
    clear("");
    close(false);
  };

  return (
    <div className="user-preferences">
      {/* Restrictions */}
      <div className="preferences-card">
        <h3>Dietary Restrictions</h3>
        <div className="preference-icons">
          {sortedRests.map((r) => (
            <Pill key={`rest-${r}`} label={r} onRemove={onRemoveRestriction} />
          ))}

          {!addingRest ? (
            <AddPill onClick={() => setAddingRest(true)} label="Add" />
          ) : (
            // FULL-WIDTH input row (cleaner look)
            <div className="pill-add-row">
              <img src="/add_pref_icon.png" alt="" aria-hidden="true" className="pill-add-icon" />
              <input
                type="text"
                placeholder="Add restriction"
                value={restInput}
                onChange={(e) => setRestInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && add(restInput, onAddRestriction, setRestInput, setAddingRest)
                }
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => add(restInput, onAddRestriction, setRestInput, setAddingRest)}
              >
                Add
              </button>
              <button type="button" className="btn-ghost" onClick={() => setAddingRest(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Likes */}
      <div className="preferences-card">
        <h3>Food Preferences</h3>
        <div className="preference-icons">
          {sortedLikes.map((l) => (
            <Pill key={`like-${l}`} label={l} onRemove={onRemoveLike} />
          ))}

          {!addingLike ? (
            <AddPill onClick={() => setAddingLike(true)} label="Add" />
          ) : (
            <div className="pill-add-row">
              <img src="/add_pref_icon.png" alt="" aria-hidden="true" className="pill-add-icon" />
              <input
                type="text"
                placeholder="Add preference"
                value={likeInput}
                onChange={(e) => setLikeInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && add(likeInput, onAddLike, setLikeInput, setAddingLike)
                }
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => add(likeInput, onAddLike, setLikeInput, setAddingLike)}
              >
                Add
              </button>
              <button type="button" className="btn-ghost" onClick={() => setAddingLike(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
