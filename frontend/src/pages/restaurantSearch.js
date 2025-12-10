import React, { useState, useEffect, useMemo } from "react";
// NEW: Import Firebase auth functions
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "../styles/restaurantSearch.css";
import DishCard from "../components/Dashboard/DishCard";
import Category from "../components/restaurantCategories";
import { getUserCity } from "../components/GetUserLoc";
import { getRestaurant } from "../components/GetRestaurant";
import { fetchMe } from "../userapi/meApi";

// NEW: Helper function for making secure API calls
async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const token = await user.getIdToken();
  const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
  return fetch(url, { ...options, headers });
}

//const DEFAULT_RADIUS_MI = 10;
const DEFAULT_UNITS = "mi";
const SERVER_RADIUS_MI = 20;   

// Quick category → query mapping for one-tap searches
const CATEGORY_TO_QUERY = {
  Bakery: "bakery",
  Burger: "burger",
  Beverage: "coffee", // or "beverage"
  Chicken: "chicken",
  Pizza: "pizza",
  Seafood: "seafood",
};

// "recently viewed)"" config for localStorage
const RECENTS_KEY = "yn_recent_restaurants";
const RECENTS_LIMIT = 12;

/**
 * Format distance (number or numeric string) to "X.X mi".
 * Examples: 2 -> "2.0 mi", "1.234" -> "1.2 mi"
 */
const formatDistance = (d) =>
  typeof d === "number" ? `${d.toFixed(1)} mi` : d ? `${Number(d).toFixed(1)} mi` : "";

/**
 * Construct a readable address string from the various possible API fields.
 * Falls back gracefully if some fields are missing.
 */
const formatAddress = (r) =>
  r.address_string ||
  [r.street1 || r.street || r.address, r.city, r.state, r.postcode || r.postalcode]
    .filter(Boolean)
    .join(", ");

/**
 * Normalize a string for simple fuzzy matching:
 * - lowercases
 * - strips non-alphanumeric characters
 */    
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
/**
 * Normalize various price formats from the API into "$", "$$", "$$$", etc.
 */
const normalizePrice = (p) => {
  if (!p) return null;

  const asString = String(p).trim();

  // If there are dollar signs, keep the first contiguous run ("$", "$$", "$$$")
  const dollarRun = asString.match(/\$+/);
  if (dollarRun) {
    return dollarRun[0];
  }

  // Handle ranges like "$$ - $$$" or "££ - £££" by taking the first segment
  if (asString.includes("-")) {
    return asString.split("-")[0].trim();
  }

  return asString;
};

function RestaurantSearch() {
  // UI + request state
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location state (lat/lng + human-readable label) ----
  const [longLat, setlongLat] = useState(null);
  const [location, setLocation] = useState("Detecting...");
  const [searchResults, setSearchResults] = useState(null);
  
  //------------ NEW: location sharing toggle (default ON, persisted) ----------
  const [isSharing, setIsSharing] = useState(() => {
    try {
      const stored = localStorage.getItem("yumNomLocationSharing");
      if (stored !== null) return JSON.parse(stored);
      const legacy = localStorage.getItem("yumNomLocationOptOut");
      return legacy !== null ? !JSON.parse(legacy) : true;
    } catch { return true; }
  });
  
  // Currently active quick category (null when user types a query)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Local "recently viewed" restaurants
  const [recents, setRecents] = useState([]);
  // Profile exclusions (restaurant names)
  const [excludedRestaurants, setExcludedRestaurants] = useState([]);
  
  // NEW: State to hold the user's favorites
  const [favorites, setFavorites] = useState([]);
  
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "yumNomLocationSharing" && e.newValue != null) {
        setIsSharing(JSON.parse(e.newValue));
      }
      if (e.key === "yumNomLocationOptOut" && e.newValue != null) {
        setIsSharing(!JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 1) On mount: detect user's city and lat/lng.
  //    This populates 'location' (for display) and 'longLat' (for API calls).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSharing) {
        setLocation("No location (sharing off)");
        setlongLat(null);
        return;
      }
      setLocation("Detecting...");
      try {
        const data = await getUserCity(); // honors opt-out; throws with .code
        if (!cancelled) {
          setLocation(`${data.city}, ${data.state}`);
          setlongLat({ longitude: data.longitude, latitude: data.latitude });
        }
      } catch (err) {
        if (!cancelled) {
          const code = err?.code;
          if (code === "GEO_DENIED") setLocation("Location permission denied.");
          else if (code === "GEO_OPT_OUT") setLocation("No location (sharing off)");
          else if (code === "BACKEND_UNAVAILABLE") setLocation("Location service unavailable.");
          else setLocation(err?.message || "Location unavailable");
          setlongLat(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isSharing]);

  // NEW: On mount, fetch the user's favorites list
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchFavorites = async () => {
          try {
            const favRes = await fetchWithAuth('http://localhost:5001/favorites?type=restaurants');
            if (favRes.ok) {
              const favData = await favRes.json();
              setFavorites(favData.items || []);
            }
          } catch (error) {
            console.error("Failed to fetch favorites:", error);
          }
        };
        fetchFavorites();
      }
    });
    return () => unsubscribe();
  }, []);

  // 2) Once we have lat/lng, auto-run a nearby search with default distance.
  //    We also reveal the results panel by default in this case.
  useEffect(() => {
    if (longLat?.latitude && longLat?.longitude) {
      setShowSearchResults(true); // show list by default
      // Empty query → "browse nearby"
      fetchRestaurants({ q: "" }); // no query → browse nearby
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longLat]);

  // 3) Load "recents" from localStorage on mount.
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    setRecents(Array.isArray(saved) ? saved : []);
  }, []);

  // Load excluded restaurant names from user profile
  useEffect(() => {
      (async () => {
        try {
          const me = await fetchMe();
          const items = Array.isArray(me?.exclusions?.items) ? me.exclusions.items : [];
          setExcludedRestaurants(items);
        } catch (e) {
          // Non-fatal if profile isn't available yet
          console.warn("Unable to load profile exclusions:", e?.message || e);
        }
      })();
    }, []);

  /**
   * Add a restaurant to "recents":
   * - Builds a minimal object (id, name, address, imageUrl)
   * - De-dupes by id
   * - Trims to RECENTS_LIMIT
   * - Persists to localStorage
   */
  const addRecent = (r) => {
    const addr = formatAddress(r);
    const id = r.location_id || `${r.name}-${addr}`;
    const image =
      r.photoUrl || r.image_url || r.photo?.images?.large?.url || null;

    const item = {
      id,
      name: r.name,
      address: addr,
      imageUrl: image,
    };

    setRecents((prev) => {
      const filtered = (prev || []).filter((x) => x.id !== id);
      const next = [item, ...filtered].slice(0, RECENTS_LIMIT);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      return next;
    });
  };
  
  //Filter popover visibility + selected values
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);

  // Toggle helpers for dropdowns
  const toggleDistance = () => setShowDistanceDropdown(!showDistanceDropdown);
  const togglePrice = () => setShowPriceDropdown(!showPriceDropdown);

  /**
   * Compute the active query:
   * - If a category is selected, use its mapped term
   * - Otherwise use the text input
   */
  // const currentQuery = () =>
  //   selectedCategory ? CATEGORY_TO_QUERY[selectedCategory] : (searchText || "").trim();
  
  /**
   * Manual search submit:
   * - Requires lat/lng (location detection)
   * - Clears selectedCategory (manual query overrides chip)
   * - Triggers fetch with current distance (or default)
   */
  const handleSearch = () => {
    const latitude = longLat?.latitude;
    const longitude = longLat?.longitude;

    setShowSearchResults(true);
    if (!latitude || !longitude) {
      setError("Allow location to load.");
      return;
    }

    // If user manually searches, clear any active category
    if (selectedCategory) setSelectedCategory(null);

    setError("");
    fetchRestaurants({ q: (searchText || "").trim() });
  };

   /**
   * Category chip click:
   * - Sets selectedCategory
   * - Shows results panel
   * - Triggers fetch with the mapped term at the active/ default distance
   */
  const handleCategoryPick = (cat) => {
    setSelectedCategory(cat);
    setShowSearchResults(true);
    const q = CATEGORY_TO_QUERY[cat] || cat;
    fetchRestaurants({ q });
  };

  /**
   * Core data fetch:
   * - Calls getRestaurant(long, lat, miles, units, q)
   * - Client-side post-filtering when q is present (simple contains check)
   * - Sorts by distance ascending
   * - Stores results in state
   *
   * Error handling:
   * - Sets user-friendly error message; console.error retains raw error for devs
   */
  const fetchRestaurants = async ({ q }) => {
    if (!longLat?.latitude || !longLat?.longitude) return;
    setLoading(true);
    setError("");

    const distanceMiles = SERVER_RADIUS_MI; 
    const units = DEFAULT_UNITS;

    try {
      const data = await getRestaurant(
        longLat.longitude,
        longLat.latitude,
        distanceMiles,
        units,
        (q || "").trim()
      );
      
      // Defensive: TripAdvisor wrapper should return { data: [...] }
      let rows = Array.isArray(data?.data) ? data.data : [];
      // after rows are sorted & exclusions applied
      rows = rows.slice().sort((a, b) => {
        const da = parseFloat(a?.distance);
        const db = parseFloat(b?.distance);
        return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity);
      });

      // see how many and how far the API is giving us
      const distances = rows
        .map((r) => parseFloat(r.distance))
        .filter((d) => Number.isFinite(d));
      if (distances.length) {
        console.log(
          "TripAdvisor returned",
          rows.length,
          "items. Min distance:",
          Math.min(...distances),
          "Max distance:",
          Math.max(...distances)
        );
      }

      // If a query exists, do a lenient, client-side fuzzy match on a few fields
      // Only fuzzy-filter manual queries, not quick categories
      if (q && !selectedCategory) {
        const qNorm = norm(q);
        rows = rows.filter((r) =>
          [r.name, r.address_string, r.city, r.state].some((f) => norm(f).includes(qNorm))
        );
      }

      // Sort by numeric distance (missing values sink to bottom)
      rows = rows.slice().sort((a, b) => {
        const da = parseFloat(a?.distance);
        const db = parseFloat(b?.distance);
        return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity);
      });
       // Exclude restaurants from profile preferences (case-insensitive exact name match)
      if (excludedRestaurants?.length) {
          const ex = new Set(excludedRestaurants.map((n) => norm(n)));
          rows = rows.filter((r) => !ex.has(norm(r?.name)));
        }

      setSearchResults({ data: rows });
    } catch (e) {
      console.error(e);
      setError("Unable to fetch restaurants.");
    } finally {
      setLoading(false);
    }
  };
  
  // NEW: This is the function that will add or remove a favorite
  const handleToggleFavorite = async (restaurant) => {
    const uniqueId = restaurant.location_id;
    const isFavorited = favorites.some(fav => fav.api_id === uniqueId);
    
    if (isFavorited) {
      const favoriteToRemove = favorites.find(fav => fav.api_id === uniqueId);
      if (!favoriteToRemove) return;
      
      try {
        await fetchWithAuth(`http://localhost:5001/favorites/${favoriteToRemove.id}`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(fav => fav.api_id !== uniqueId));
      } catch (error) {
        console.error("Failed to unfavorite:", error);
      }
    } else {
      try {
        const response = await fetchWithAuth(`http://localhost:5001/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_id: uniqueId,
            name: restaurant.name,
            photo_url: restaurant.photoUrl || restaurant.image_url || restaurant.photo?.images?.large?.url || null,
            type: 'restaurants'
          }),
        });
        if (response.ok) {
          const newFavorite = await response.json();
          const newFavItem = { 
            id: newFavorite.favoriteId, 
            api_id: uniqueId, 
            name: restaurant.name, 
            photo_url: restaurant.photoUrl || restaurant.image_url || restaurant.photo?.images?.large?.url || null 
          };
          setFavorites(prev => [...prev, newFavItem]);
        }
      } catch (error) {
        console.error("Failed to favorite:", error);
      }
    }
  };

  /**
   * Clear all filters and search inputs:
   * - Resets distance, price, category, and text
   * - Closes dropdowns
   * - Refreshes results with default radius and empty query
   */
  const handleClearFilters = () => {
    setSelectedDistance(null);
    setSelectedPrice(null);
    setSelectedCategory(null);
    setSearchText("");
    setShowDistanceDropdown(false); 
    setShowPriceDropdown(false);    
    fetchRestaurants({ q: ""});
  };

  /**
   * Distance radio handler:
   * - Allows deselect (clicking the same value toggles off)
   * - Immediately re-fetches from server using the new distance
   */
  const handleDistanceRadio = (value) => {
    setSelectedDistance((prev) => (prev === value ? null : value));
  };
  

  /**
   * Price radio handler:
   * - Only updates local state
   * - Price filtering stays client-side (no refetch)
   */
  const handlePriceRadio = (value) => {
    setSelectedPrice((prev) => (prev === value ? null : value));
  };

  /**
   * Memoized, price-filtered list of restaurants for display:
   * - If no price selected → return all current results
   * - Coerces different price fields into a normalized "$"..."$$$"
   */
  const displayed = useMemo(() => {
    let base = Array.isArray(searchResults?.data) ? searchResults.data : [];
  
    // 1) Distance filter (client-side)
    if (selectedDistance) {
      const limitMiles = Number(selectedDistance.split(" ")[0]); // 5, 10, or 15
      base = base.filter((r) => {
        const d = parseFloat(r?.distance);
        // if distance missing, keep it; otherwise enforce <= selected miles
        return !Number.isFinite(d) || d <= limitMiles;
      });
    }
  
    // 2) Price filter (existing logic)
    if (!selectedPrice) return base;
    const priceKey = (r) => r.price_level || r.price || r.price_range || null;
  
    return base.filter((r) => {
      const raw = priceKey(r);
      if (!raw) return true; // keep items with no price info
  
      const normalized = normalizePrice(raw);
      return normalized === selectedPrice;
    });
  }, [searchResults, selectedDistance, selectedPrice]);
  
  
  return (
    <div className="Restaurant-container">
      <h3 className="Restaurant-container-title">Restaurant Search</h3>
      <div>
        {/* LOCATION */}
        <div className="location-display">
          <span><strong>Current Location:</strong> {location}</span>
        </div>

        {/* SEARCH BAR */}
        <div className="Restaurant-search-bar-wrapper">
          <div className="Restaurant-search-bar">
            <span className="search-icon">
              <img src="/search.png" alt="arrow" className="search-glass" />
            </span>
            <input
              type="text"
              placeholder="Search Resturant"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="Restaurant-search-enter-button">Enter</button>
        </div>

        {/* FILTERS */}
        <div className="filters-bar">
          <div className="filter-pill1">Filters: </div>
          <div className="filter-dropdown">
            <button className="filter-pill" onClick={toggleDistance}>
              Distance {selectedDistance ? `: ${selectedDistance} ` : ""}
              <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" />
            </button>
            {showDistanceDropdown && (
              <div className="dropdown-menu">
                <label><input type="radio" name="distance" value="1 mi" checked={selectedDistance === "1 mi"} onChange={(e) => handleDistanceRadio(e.target.value)} /> 1 mi</label>
                <label><input type="radio" name="distance" value="5 mi" checked={selectedDistance === "5 mi"} onChange={(e) => handleDistanceRadio(e.target.value)} /> 5 mi</label>
                <label><input type="radio" name="distance" value="10 mi" checked={selectedDistance === "10 mi"} onChange={(e) => handleDistanceRadio(e.target.value)} /> 10 mi</label>
              </div>
            )}
          </div>
          <div className="filter-dropdown">
            <button className="filter-pill" onClick={togglePrice}>
              Price {selectedPrice ? `: ${selectedPrice}` : ""}
              <img src="/Vector.jpeg" alt="arrow" className="dropdown-arrow" />
            </button>
            {showPriceDropdown && (
              <div className="dropdown-menu">
                <label><input type="radio" name="price" value="$" checked={selectedPrice === "$"} onChange={(e) => handlePriceRadio(e.target.value)} /> $ </label>
                <label><input type="radio" name="price" value="$$" checked={selectedPrice === "$$"} onChange={(e) => handlePriceRadio(e.target.value)} /> $$ </label>
                <label><input type="radio" name="price" value="$$$" checked={selectedPrice === "$$$"} onChange={(e) => handlePriceRadio(e.target.value)} /> $$$ </label>
              </div>
            )}
          </div>
          <span className="clear-filters-link" onClick={handleClearFilters}>
            Clear filters
          </span>
        </div>
      </div>

      {/* Categories (now clickable) */}
      <Category onPick={handleCategoryPick} active={selectedCategory} />

      {/* Results */}
      {showSearchResults && (
        <>
          <div className="section-header">
            <h4>Nearby Restaurants</h4>
          </div>
          {loading && <p>Loading nearby restaurants…</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <>
              {Array.isArray(displayed) && displayed.length > 0 ? (
                <div className="restaurant-grid">
                  {displayed.map((r) => (
                    <DishCard
                      key={r.location_id || `${r.name}-${r.address_string}`}
                      name={r.name}
                      address={formatAddress(r)}
                      distance={formatDistance(r.distance)}
                      imageUrl={r.photoUrl || r.image_url || r.photo?.images?.large?.url || null}
                      // NEW: Pass the favorite status and toggle function to the card
                      isFavorited={favorites.some(fav => fav.api_id === r.location_id)}
                      onToggleFavorite={() => handleToggleFavorite(r)}
                      onViewMenu={() => {
                        addRecent(r);
                        const q = encodeURIComponent(`${r.name} ${formatAddress(r)}`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p>No restaurants found with the current filters.</p>
              )}
            </>
          )}
        </>
      )}

      {/* Recently Viewed Section */}
      {recents.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 24 }}>
            <h4>Your Recent Searches</h4>
          </div>
          <div className="restaurant-grid">
            {recents.map((r) => (
              <DishCard
                key={r.id}
                name={r.name}
                address={r.address}
                imageUrl={r.imageUrl}
                // NEW: heart state + toggler
                isFavorited={favorites.some((fav) => fav.api_id === r.id)}
                onToggleFavorite={() =>
                  handleToggleFavorite({
                    // fake a TripAdvisor-like object for the helper
                    location_id: r.id,
                    name: r.name,
                    photoUrl: r.imageUrl,
                  })
                }
                onViewMenu={() => {
                  const q = encodeURIComponent(`${r.name} ${r.address}`);
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${q}`,
                    "_blank"
                  );
                }}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}

export default RestaurantSearch;