// this is the code for the user location, for when using restSearcg, and backend stuff
// src/utils/getUserLocation.js

// location detection might not work on linux + firefox , chrome works :)
// const base_url = process.env.REACT_APP_BACKEND_URL;

// export const getUserCity = async () => {
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) {
//         reject("Geolocation not supported.");
//       }
  
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
// 					console.log(base_url + `city?latitude=${latitude}&longitude=${longitude}`);
  
//           try {
//             const res = await fetch(
//               base_url + `/city?latitude=${latitude}&longitude=${longitude}`
// 						);
//             const data = await res.json();
  
//             const components = data.results[0].components;
//             const city = components.city || components.town || components.village || components.county;
//             const state = components.state || "";
  
//             resolve({ city, state, latitude, longitude });
//           } catch (error) {
//             console.error("Reverse geocoding failed:", error);
//             reject("Unable to get city from location.");
//           }
//         },
//         (err) => {
//           console.error("Geolocation error:", err);
//           reject("Geolocation permission denied.");
//         }
//       );
//     });
//   };
  
// src/utils/getUserLocation.js
// const base_url = process.env.REACT_APP_BACKEND_URL;

// export const getUserCity = async () => {
//   // NEW: honor user opt-out (do not call geolocation at all)
//   try {
//     const optOut = JSON.parse(localStorage.getItem("yumNomLocationOptOut") || "false");
//     if (optOut) {
//       const e = new Error("GEO_OPT_OUT");
//       e.code = "GEO_OPT_OUT";
//       throw e;
//     }
//   } catch (_) {} // ignore JSON errors

//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) {
//       const e = new Error("Geolocation not supported.");
//       e.code = "GEO_UNSUPPORTED";
//       return reject(e);
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         try {
//           const res = await fetch(`${base_url}/city?latitude=${latitude}&longitude=${longitude}`);
//           const data = await res.json();
//           const components = data.results[0].components;
//           const city = components.city || components.town || components.village || components.county;
//           const state = components.state || "";
//           resolve({ city, state, latitude, longitude });
//         } catch (error) {
//           const e = new Error("Unable to get city from location.");
//           e.code = "GEOCODE_FAILED";
//           reject(e);
//         }
//       },
//       (err) => {
//         const e = new Error(err.code === err.PERMISSION_DENIED ? "Geolocation permission denied." : "Geolocation error.");
//         e.code = err.code === err.PERMISSION_DENIED ? "GEO_DENIED" : "GEO_ERROR";
//         reject(e);
//       }
//     );
//   });
// };
// src/components/GetUserLoc.js
const base_url = process.env.REACT_APP_BACKEND_URL;

/**
 * Detect user location (if sharing is ON).
 * Returns: { city, state, latitude, longitude }
 * Throws Error with .code:
 *  GEO_OPT_OUT, GEO_UNSUPPORTED, GEO_DENIED, GEO_ERROR, GEOCODE_FAILED, BACKEND_UNAVAILABLE
 */
export const getUserCity = async () => {
  // get information of the user's preference of the location (respect if they have it on or off)
  try {
    const optOut = JSON.parse(localStorage.getItem("yumNomLocationOptOut") || "false");  // gets whether the location is on or off from locationPref local storage!
    if (optOut) {
      const e = new Error("Location sharing is OFF");  
      e.code = "GEO_OPT_OUT";
      throw e;
    }
  } catch { /* ignore */ }  // this is if location is on, then go on with the rest of the code to get location

  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      const e = new Error("Geolocation not supported.");
      e.code = "GEO_UNSUPPORTED";
      return reject(e);
    }

    navigator.geolocation.getCurrentPosition(  // getting location with geolocation
      async ({ coords }) => {
        const { latitude, longitude } = coords;

        const url = `${base_url}/city`; //  adjust if server uses /api prefix elsewhere

        try {
          const res = await fetch(
            `${url}?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
          );
          if (!res.ok) {
            const e = new Error("Unable to get city from location.");
            e.code = "GEOCODE_FAILED";
            return reject(e);
          }
          const data = await res.json();
          const components = data?.results?.[0]?.components || {};
          const city =
            components.city || components.town || components.village || components.county || "";
          const state = components.state || "";
          resolve({ city, state, latitude, longitude });
        } catch {
          const e = new Error("Backend unavailable.");
          e.code = "BACKEND_UNAVAILABLE";
          reject(e);
        }
      },
      (err) => {
        const denied = typeof err?.code !== "undefined" && err.code === err.PERMISSION_DENIED;
        const e = new Error(denied ? "Geolocation permission denied." : "Geolocation error.");
        e.code = denied ? "GEO_DENIED" : "GEO_ERROR";
        reject(e);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
};
