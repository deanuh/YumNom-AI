// // for the user to manually add their preferred location
// // or turn off/on their location 
// // function LocationPref() {
// //     return <div><h3>The page to update user location</h3>
// //     <p>Here you will change your location preferences and update the conditions</p></div>;
// //   }
// // export default LocationPref;
// // src/pages/LocationPref.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../../styles/settings.css";
// import { getUserCity as getUserLocation } from "../../components/GetUserLoc";

// export default function LocationPref() {
//   const navigate = useNavigate();
//   const [status, setStatus] = useState("");
//   const [loc, setLoc] = useState(null);
//   const [manual, setManual] = useState({ city: "", state: "" });

//   // Use a positive flag for clarity: isSharing
//   const [isSharing, setIsSharing] = useState(true); // default ON

//   // Load persisted prefs
//   useEffect(() => {
//     try {
//       // Backward compatibility: if old opt-out flag exists, invert it
//       const legacyOptOut = localStorage.getItem("yumNomLocationOptOut");
//       if (legacyOptOut !== null) {
//         const optOut = JSON.parse(legacyOptOut);
//         setIsSharing(!Boolean(optOut));
//       } else {
//         // if later store a positive flag, prefer it:
//         const stored = localStorage.getItem("yumNomLocationSharing");
//         if (stored !== null) setIsSharing(Boolean(JSON.parse(stored)));
//       }

//       const saved = JSON.parse(localStorage.getItem("yumNomLocationPref") || "null");
//       if (saved && (saved.city || saved.state)) {
//         setManual({ city: saved.city || "", state: saved.state || "" });
//       }
//     } catch (_) {}
//   }, []);

//   // Persist whenever it changes
//   useEffect(() => {
//     localStorage.setItem("yumNomLocationSharing", JSON.stringify(isSharing));
//     // Maintain legacy key too (so existing code that reads opt-out still works)
//     localStorage.setItem("yumNomLocationOptOut", JSON.stringify(!isSharing));

//     if (!isSharing) {
//       // If user turned sharing OFF, clear any stored GPS coords but keep manual default
//       try {
//         const saved = JSON.parse(localStorage.getItem("yumNomLocationPref") || "null");
//         const manualOnly = saved ? { city: saved.city || "", state: saved.state || "" } : { city: "", state: "" };
//         localStorage.setItem("yumNomLocationPref", JSON.stringify(manualOnly));
//       } catch (_) {}
//       setLoc(null);
//       setStatus("Location sharing is OFF.");
//     } else {
//       setStatus("Location sharing is ON. You can Detect Location now.");
//     }
//   }, [isSharing]);

//   async function detect() {
//     setStatus("Requesting location…");
//     setLoc(null);
//     try {
//       const info = await getUserLocation(); // calls /city behind the scenes
//       setLoc(info);
//       setStatus(`Detected: ${info.city}${info.state ? ", " + info.state : ""}`);
//     } catch (e) {
//       setLoc(null);
//       setStatus(e.code || String(e));
//     }
//   }

//   function saveDetected() {
//     if (!loc) return;
//     localStorage.setItem("yumNomLocationPref", JSON.stringify(loc));
//     setStatus(`Saved default: ${loc.city}${loc.state ? ", " + loc.state : ""}`);
//   }

//   function saveManual() {
//     const city = manual.city.trim();
//     const state = manual.state.trim();
//     if (!city && !state) return setStatus("Enter a city or state.");
//     localStorage.setItem("yumNomLocationPref", JSON.stringify({ city, state }));
//     setStatus(`Saved default: ${city}${city && state ? ", " + state : ""}`);
//   }

//   return (
//     <main className="lp-container">
//       <button className="Set-back-button lp-back" onClick={() => navigate("/settings")}>
//         ← Back to Settings
//       </button>

//       <h1 className="lp-title">Location Preferences</h1>
//       <p className="lp-subtitle">
//         Use your current location for nearby results, or set a default city/state.
//       </p>

//       {/* Sharing toggle: ON when checked, OFF when unchecked */}
//       <div className="lp-row">
//         <label className="lp-switch">
//           <input
//             type="checkbox"
//             checked={isSharing}                 // <-- ON by default
//             onChange={(e) => setIsSharing(e.target.checked)}
//           />
//           <span className="lp-slider" />
//         </label>
//         <div className="lp-row-text">
//           <div className="lp-row-title">
//             {isSharing ? "Location sharing is ON" : "Location sharing is OFF"}
//           </div>
//           <div className="lp-row-sub">
//             {isSharing
//               ? "We may request your device location when you tap Detect Location."
//               : "We won't request your device location. You can still set a manual default city/state."}
//           </div>
//         </div>
//       </div>

//       {/* Detect section (disabled when OFF) */}
//       <section className={`lp-section ${!isSharing ? "lp-disabled" : ""}`}>
//         <h2 className="lp-h2">Use My Current Location</h2>
//         <button
//           onClick={detect}
//           className="Set-back-button lp-action"
//           disabled={!isSharing}
//           title={!isSharing ? "Turn location sharing ON to detect." : undefined}
//         >
//           Detect Location
//         </button>
//         {status && <p className="lp-status">{status}</p>}

//         {(status === "GEO_DENIED" || status === "Geolocation permission denied.") && (
//           <div className="lp-instructions">
//             <strong>Location is blocked in your browser.</strong> To re-enable:
//             <ul>
//               <li>Chrome: Lock icon → Site settings → Location → Allow → Refresh</li>
//               <li>Safari: Settings → Websites → Location → Allow for this site</li>
//               <li>Firefox: Preferences → Privacy & Security → Permissions → Location</li>
//             </ul>
//           </div>
//         )}

//         {loc && (
//           <div className="lp-preview">
//             <div>
//               Preview: <strong>{loc.city}{loc.state ? ", " + loc.state : ""}</strong>
//             </div>
//             <button onClick={saveDetected} className="Set-back-button lp-action">
//               Save This as Default
//             </button>
//           </div>
//         )}
//       </section>

//       {/* Manual fallback always available */}
//       <section className="lp-section">
//         <h2 className="lp-h2">Set a Default Manually</h2>
//         <div className="lp-grid">
//           <input
//             type="text"
//             className="lp-input"
//             placeholder="City"
//             value={manual.city}
//             onChange={(e) => setManual({ ...manual, city: e.target.value })}
//           />
//           <input
//             type="text"
//             className="lp-input"
//             placeholder="State/Province"
//             value={manual.state}
//             onChange={(e) => setManual({ ...manual, state: e.target.value })}
//           />
//         </div>
//         <button onClick={saveManual} className="Set-back-button lp-action">
//           Save Manual Default
//         </button>
//         <p className="lp-footnote">
//           We’ll use this when geolocation isn’t available, is denied, or when sharing is OFF.
//         </p>
//       </section>
//     </main>
//   );
// }
// src/pages/LocationPref.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css"; // your css with lp-* classes

export default function LocationPref() {
  const navigate = useNavigate();

  // Default ON unless user has turned it off before
  const [isSharing, setIsSharing] = useState(() => {
    try {
      const stored = localStorage.getItem("yumNomLocationSharing");
      if (stored !== null) return JSON.parse(stored);
      const legacy = localStorage.getItem("yumNomLocationOptOut");
      return legacy !== null ? !JSON.parse(legacy) : true;
    } catch {
      return true;
    }
  });

  // Persist the toggle and keep legacy inverse for any old code
  useEffect(() => {
    localStorage.setItem("yumNomLocationSharing", JSON.stringify(isSharing));
    localStorage.setItem("yumNomLocationOptOut", JSON.stringify(!isSharing));
  }, [isSharing]);

  return (
    <main className="lp-container">
      <button className="Set-back-button lp-back" onClick={() => navigate("/settings")}>
        ← Back to Settings
      </button>

      <h1 className="lp-title">Location Preferences</h1>
      <p className="lp-subtitle">
        Allow YumNom to use your device location for nearby restaurant results.
      </p>

      {/* Sharing toggle: ON when checked, OFF when unchecked */}
      <div className="lp-row">
        <label className="lp-switch">
          <input
            type="checkbox"
            checked={isSharing} // ON by default
            onChange={(e) => setIsSharing(e.target.checked)}
          />
          <span className="lp-slider" />
        </label>

        <div className="lp-row-text">
          <div className="lp-row-title">
            {isSharing ? "Location sharing is ON" : "Location sharing is OFF"}
          </div>
          <div className="lp-row-sub">
            {isSharing
              ? "We may request your device location when searching for restaurants."
              : "We won’t request your device location."}
          </div>
        </div>
      </div>
    </main>
  );
}
