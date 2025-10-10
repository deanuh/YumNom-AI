import React, { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState({
    username: "",
    first_name: "",
    last_name: "",
    profile_picture: "",
  });

  useEffect(() => {
    (async () => {
      try {
        // 1) Try to read the existing profile first.
        const existing = await fetchMe();
        if (existing && existing.username) {
          setMe(existing);
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
        setMe(created);
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
  

  const handleSaveProfile = async (partial) => {
    try {
      // Update only the fields changed (username, profile_picture, etc.)
      await updateMe(partial);
  
      // Fetch the fresh version of the user after updating
      const updated = await fetchMe();
      setMe(updated);
      console.log("Profile updated successfully:", updated);
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
      <ProfileTabs />
      <AllergensSection />
      <FoodPreferences />
      <RestaurantPreferences />
      <GroupSettings />
    </div>
  );
};

export default UserProfilePage;
