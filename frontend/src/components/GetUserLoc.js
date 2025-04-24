// this is the code for the user location, for when using restSearcg, and backend stuff
// src/utils/getUserLocation.js

export const getUserCity = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported.");
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const key = process.env.REACT_APP_OPENCAGE_API_KEY;
  
          try {
            const res = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${key}`
            );
            const data = await res.json();
  
            const components = data.results[0].components;
            const city = components.city || components.town || components.village || components.county;
            const state = components.state || "";
  
            resolve({ city, state, latitude, longitude });
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
            reject("Unable to get city from location.");
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          reject("Geolocation permission denied.");
        }
      );
    });
  };
  