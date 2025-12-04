// src/components/GetUserLoc.js
const base_url = process.env.REACT_APP_BACKEND_URL;
const LAST_LOC_KEY = "yn_last_location";

/**
 * Detect user location (if sharing is ON).
 * Returns: { city, state, latitude, longitude }
 * Throws Error with .code:
 *  GEO_OPT_OUT, GEO_UNSUPPORTED, GEO_DENIED, GEO_ERROR, GEOCODE_FAILED, BACKEND_UNAVAILABLE
 */
export const getUserCity = async () => {
  // Respect user opt-out from Location Preferences
  try {
    const optOut = JSON.parse(
      localStorage.getItem("yumNomLocationOptOut") || "false"
    );
    console.log("Location opt-out flag:", optOut);
    if (optOut) {
      const e = new Error("Location sharing is OFF");
      e.code = "GEO_OPT_OUT";
      throw e;
    }
  } catch {
    /* ignore */
  }

  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      const e = new Error("Geolocation not supported.");
      e.code = "GEO_UNSUPPORTED";
      return reject(e);
    }

    navigator.geolocation.getCurrentPosition(
      // SUCCESS: we have fresh coords from the browser
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        const url = `${base_url}/city`;

        try {
          const res = await fetch(
            `${url}?latitude=${encodeURIComponent(
              latitude
            )}&longitude=${encodeURIComponent(longitude)}`
          );
          if (!res.ok) {
            // Try fallback before failing
            try {
              const cached = localStorage.getItem(LAST_LOC_KEY);
              if (cached) {
                console.warn("Using cached location (backend not ok)");
                return resolve(JSON.parse(cached));
              }
            } catch {
              /* ignore */
            }

            const e = new Error("Unable to get city from location.");
            e.code = "GEOCODE_FAILED";
            return reject(e);
          }

          const data = await res.json();
          const components = data?.results?.[0]?.components || {};
          const city =
            components.city ||
            components.town ||
            components.village ||
            components.county ||
            "";
          const state = components.state || "";

          const payload = { city, state, latitude, longitude };

          // Cache last successful location so we can reuse it on future errors
          try {
            localStorage.setItem(LAST_LOC_KEY, JSON.stringify(payload));
          } catch {
            /* ignore */
          }

          resolve(payload);
        } catch {
          // Network / backend completely unavailable
          try {
            const cached = localStorage.getItem(LAST_LOC_KEY);
            if (cached) {
              console.warn("Using cached location (backend unavailable)");
              return resolve(JSON.parse(cached));
            }
          } catch {
            /* ignore */
          }

          const e = new Error("Backend unavailable.");
          e.code = "BACKEND_UNAVAILABLE";
          reject(e);
        }
      },

      // ERROR: geolocation itself failed (timeout, unavailable, etc.)
      (err) => {
        console.error("Geolocation raw error:", err);
        const denied =
          typeof err?.code !== "undefined" && err.code === err.PERMISSION_DENIED;

        // If not explicitly denied, try to fall back to last known location
        if (!denied) {
          try {
            const cached = localStorage.getItem(LAST_LOC_KEY);
            if (cached) {
              console.warn("Using cached location (geolocation failure)");
              return resolve(JSON.parse(cached));
            }
          } catch {
            /* ignore */
          }
        }

        // No cached location or permission was denied → hard fail
        const e = new Error(
          denied ? "Geolocation permission denied." : "Geolocation error."
        );
        e.code = denied ? "GEO_DENIED" : "GEO_ERROR";
        reject(e);
      },

      // OPTIONS: be a bit more tolerant before timing out
      {
        enableHighAccuracy: false,
        timeout: 20000, // 20s instead of 10s
        maximumAge: 300000, // up to 5 minutes old is OK
      }
    );
  });
};
