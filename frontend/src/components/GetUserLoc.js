// this is the code for the user location, for when using restSearcg, and backend stuff
// src/utils/getUserLocation.js

// location detection might not work on linux + firefox , chrome works :)
const base_url = process.env.REACT_APP_BACKEND_URL;

export const getUserCity = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported.");
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
					console.log(base_url + `city?latitude=${latitude}&longitude=${longitude}`);
  
          try {
            const res = await fetch(
              base_url + `/city?latitude=${latitude}&longitude=${longitude}`
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
  
