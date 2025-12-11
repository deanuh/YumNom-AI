// import React, { useEffect } from "react";
// import "../styles/yumnom-splash.css";

// export default function YumNomSplash({ duration = 2000, onFinish }) {
//   useEffect(() => {
//     const t = setTimeout(() => {
//       onFinish && onFinish();
//     }, duration);
//     return () => clearTimeout(t);
//   }, [duration, onFinish]);

//   const letters = Array.from("YumNom AI");

//   return (
//     <div className="yn-splash" aria-live="polite" aria-busy="true">
//       <div className="yn-word" aria-label="YumNom">
//         {letters.map((ch, i) => (
//           <span key={i} className="yn-letter" style={{ "--i": i }}>
//             {ch}
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import "../styles/yumnom-splash.css";

export default function YumNomSplash({
  duration = 2000,      // how long letters bounce before fade-out starts
  fadeDuration = 450,   // length of the fade-out animation
  onFinish,
}) {
  const [isFading, setIsFading] = useState(false);

  // After `duration`, start fading out
  useEffect(() => {
    const mainTimer = setTimeout(() => {
      setIsFading(true);
    }, duration);

    return () => clearTimeout(mainTimer);
  }, [duration]);

  // After fade is done, call onFinish (which navigates to dashboard)
  useEffect(() => {
    if (!isFading) return;
    const fadeTimer = setTimeout(() => {
      onFinish && onFinish();
    }, fadeDuration);

    return () => clearTimeout(fadeTimer);
  }, [isFading, fadeDuration, onFinish]);

  const letters = Array.from("YumNom AI");

  return (
    <div
      className={`yn-splash ${isFading ? "yn-splash--fade-out" : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="yn-word" aria-label="YumNom">
        {letters.map((ch, i) => (
          <span key={i} className="yn-letter" style={{ "--i": i }}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

