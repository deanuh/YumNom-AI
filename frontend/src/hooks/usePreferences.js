// src/hooks/usePreferences.js
import { useCallback, useEffect, useMemo, useState } from "react";

const LS_KEY = "yn_prefs_v0";

function debounce(fn, ms = 600) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const normalize = (list) =>
  Array.from(new Set((list || []).map(s => String(s).toLowerCase().trim()))).sort();

export default function usePreferences({ uid }) {
  const [prefs, setPrefs] = useState({ likes: [], restrictions: [] });

// Load preferences (runs once on mount, or when uid changes)
  // Order of preference:
  //  1. Cloud (Firestore, if signed in)
  //  2. LocalStorage
  //  3. Defaults (empty arrays)

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (uid) {
          const res = await fetch("/preferences", { headers: { "Content-Type": "application/json" } });
          if (res.ok) {
            const cloud = await res.json();
            if (!cancelled) {
              const next = {
                likes: normalize(cloud.likes),
                restrictions: normalize(cloud.restrictions),
              };
              setPrefs(next);
              localStorage.setItem(LS_KEY, JSON.stringify(next));
              return;
            }
          }
        }
      } catch (_) {}

      // fallback to localStorage
      const raw = localStorage.getItem(LS_KEY);
      if (!cancelled && raw) setPrefs(JSON.parse(raw));
    })();
    return () => { cancelled = true; };
  }, [uid]);

// Cloud sync function
  // - Debounced so that frequent changes don’t spam server
  // - Only active when uid is present (user signed in)

  const pushCloud = useMemo(
    () =>
      debounce(async (next) => {
        if (!uid) return; // only sync when signed in
        try {
          await fetch("/preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
        } catch (e) {
          console.warn("Cloud sync skipped:", e.message);
        }
      }, 700),
    [uid]
  );

// Update state + persist locally and in cloud
  // `mutator` can be a function(prev) or a plain object

  const update = useCallback((mutator) => {
    setPrefs((prev) => {
      const draft = typeof mutator === "function" ? mutator(prev) : mutator;
      const next = {
        likes: normalize(draft.likes),
        restrictions: normalize(draft.restrictions),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      pushCloud(next);
      return next;
    });
  }, [pushCloud]);

    // Public API (functions for modifying preferences)

  const addLike = (s) => update((p) => ({ ...p, likes: [...p.likes, s] }));
  const removeLike = (s) => update((p) => ({ ...p, likes: p.likes.filter(x => x !== s) }));
  const addRestriction = (s) => update((p) => ({ ...p, restrictions: [...p.restrictions, s] }));
  const removeRestriction = (s) => update((p) => ({ ...p, restrictions: p.restrictions.filter(x => x !== s) }));

  return { prefs, addLike, removeLike, addRestriction, removeRestriction };
}
