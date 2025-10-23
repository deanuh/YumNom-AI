import React, { useEffect, useState, useRef } from "react";
import { ensureMe, fetchMe, updateMe } from '../userapi/meApi';
import { getAuth } from "firebase/auth";
import UserProfileHeader from '../components/UserProfile/UserProfileHeader';
import ProfileTabs from '../components/UserProfile/ProfileTabs';
import AllergensSection from '../components/UserProfile/AllergensSection';
import FoodPreferences from '../components/UserProfile/FoodPreferences';
import RestaurantPreferences from '../components/UserProfile/RestaurantPreferences';
import GroupSettings from '../components/UserProfile/GroupSettings';
import '../styles/UserProfile.css'; 


const UserProfilePage = () => {
  const dietaryRef = useRef(null);
  const foodRef = useRef(null);
  const [activeTab, setActiveTab] = useState("dietary");

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState({
    username: "",
    first_name: "",
    last_name: "",
    profile_picture: "",
    diet : { types: [], allergens: []},
    exclusions: {ingredients: [], items: []},
  });

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // if your main content uses a scrolling container, swap `window` for it:
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  

  useEffect(() => {
    (async () => {
      try {
        // 1) Try to read the existing profile first.
        const existing = await fetchMe();
        if (existing && existing.username) {
          setMe({
            ...existing,
            diet: existing.diet || { types: [], allergens: [] },
            exclusions: existing.exclusions || { ingredients: [], items: [] },
          });
          return;
        }
  
        // 2) If no profile (or missing username), create it with a safe default.
        const user = getAuth().currentUser;
        const suggested =
          (user?.displayName?.trim()?.replace(/\s+/g, ".") ||
           user?.email?.split("@")[0] ||
           "user") + "";
  
        await ensureMe({ username: suggested });
  
        // 3) Read again after creation.
        const created = await fetchMe();
        setMe({
             ...created,
             diet: created.diet || { types: [], allergens: [] },
             exclusions: created.exclusions || { ingredients: [], items: [] },
           });
      } catch (err) {
        // If fetchMe throws a 404/NotFound, create then refetch
        const user = getAuth().currentUser;
        const suggested =
          (user?.displayName?.trim()?.replace(/\s+/g, ".") ||
           user?.email?.split("@")[0] ||
           "user") + "";
  
        try {
          await ensureMe({ username: suggested });
          const created = await fetchMe();
          setMe(created);
        } catch (innerErr) {
          console.error("profile load failed:", innerErr?.response?.data || innerErr.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  

  // merge + optimistic update, then persist, then refresh from server
  const handleSaveProfile = async (partial) => {
        try {
          // 1) optimistic UI
          setMe((prev) => ({
            ...prev,
            ...partial,
            diet: { ...(prev.diet || {}), ...(partial.diet || {}) },
            exclusions: { ...(prev.exclusions || {}), ...(partial.exclusions || {}) },
          }));
    
          // 2) build payload that keeps diet/exclusions merged
          const next = {
            // always merge structured fields
            ...(partial.profile_picture ? { profile_picture: partial.profile_picture } : {}),
            ...(partial.username ? { username: partial.username } : {}),
            ...(partial.first_name ? { first_name: partial.first_name } : {}),
            ...(partial.last_name ? { last_name: partial.last_name } : {}),
            diet: { ...(me?.diet || {}), ...(partial.diet || {}) },
            exclusions: { ...(me?.exclusions || {}), ...(partial.exclusions || {}) },
          };
          console.log("[UserProfilePage] PUT /api/me →", next);
          await updateMe(next);
    
          // 3) refresh canonical copy
          const refreshed = await fetchMe();
          setMe({
            ...refreshed,
            diet: refreshed.diet || { types: [], allergens: [] },
            exclusions: refreshed.exclusions || { ingredients: [], items: [] },
          });
        } catch (err) {
          console.error("Failed to update profile:", err);
        }
      };
  

  if (loading) return <div className="profile-container">Loading…</div>;

return (
  <div className="profile-container">
    <UserProfileHeader
      username={me.username}
      firstName={me.first_name}
      lastName={me.last_name}
      avatarUrl={me.profile_picture}
      onSave={handleSaveProfile}
    />

    <h2>Profile Management</h2>

    {/* Top slider/tabs that SCROLL to sections */}
    <nav className="profile-tabs">
      <button
        className={`tab ${activeTab === "dietary" ? "active" : ""}`}
        onClick={() => { setActiveTab("dietary"); scrollToId("dietary"); }}
        type="button"
      >
        Dietary Restrictions
      </button>

      <button
        className={`tab ${activeTab === "food" ? "active" : ""}`}
        onClick={() => { setActiveTab("food"); scrollToId("food"); }}
        type="button"
      >
        Food Preferences
      </button>

      <button
        className={`tab ${activeTab === "restaurant" ? "active" : ""}`}
        onClick={() => { setActiveTab("restaurant"); scrollToId("restaurant"); }}
        type="button"
      >
        Restaurant Preferences
      </button>

      <button
        className={`tab ${activeTab === "group" ? "active" : ""}`}
        onClick={() => { setActiveTab("group"); scrollToId("group"); }}
        type="button"
      >
        Group Settings
      </button>
    </nav>

    {/* REAL sections with anchors the tabs scroll to */}
    <section id="dietary">
      <AllergensSection me={me} onSave={handleSaveProfile} />
    </section>

    <section id="food">
      <FoodPreferences me={me} onSave={handleSaveProfile} />
    </section>

    <section id="restaurant">
      <RestaurantPreferences me={me} onSave={handleSaveProfile} />
    </section>

    <section id="group">
    <GroupSettings me={me} />
    </section>
  </div>
);}


export default UserProfilePage;
