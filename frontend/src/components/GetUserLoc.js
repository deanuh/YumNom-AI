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
const base_url = process.env.REACT_APP_BACKEND_URL;

/**
 * getUserCity
 *
 * - Checks if user has opted out of location sharing (localStorage flag)
 * - If not opted out, uses browser geolocation API to get coordinates
 * - Sends coords to backend (/city) which calls OpenCage API
 * - Resolves with { city, state, latitude, longitude }
 * - Rejects with standardized Error objects on failure
 */
export const getUserCity = async () => {
  // 1. Honor user opt-out setting
  try {
    const optOut = JSON.parse(localStorage.getItem("yumNomLocationOptOut") || "false");
    if (optOut) {
      const e = new Error("GEO_OPT_OUT");
      e.code = "GEO_OPT_OUT";// custom error code
      throw e;
    }
  } catch (_) {} // ignore JSON errors

  // 2. Return a Promise that resolves/rejects after geolocation attempt
  return new Promise((resolve, reject) => {
    // If browser does not support geolocation
    if (!navigator.geolocation) {
      const e = new Error("Geolocation not supported.");
      e.code = "GEO_UNSUPPORTED";
      return reject(e);
    }
    // Attempt to get user position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
           // Call backend /city → reverse geocoding
          const res = await fetch(`${base_url}/city?latitude=${latitude}&longitude=${longitude}`);
          const data = await res.json();

           // Extract city/state from OpenCage response
          const components = data.results[0].components;
          const city = components.city || components.town || components.village || components.county;
          const state = components.state || "";
          resolve({ city, state, latitude, longitude });
        } catch (error) {
          // Permission denied or other geolocation error
          const e = new Error("Unable to get city from location.");
          e.code = "GEOCODE_FAILED";
          reject(e);
        }
      },
      (err) => {
        const e = new Error(err.code === err.PERMISSION_DENIED ? "Geolocation permission denied." : "Geolocation error.");
        e.code = err.code === err.PERMISSION_DENIED ? "GEO_DENIED" : "GEO_ERROR";
        reject(e);
      }
    );
  });
};
