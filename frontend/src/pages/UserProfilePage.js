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
        const user = getAuth().currentUser;
        const suggestedUsername =
          user?.email ? user.email.split("@")[0] : "";
  
        // 1) ensure profile doc exists (idempotent)
        await ensureMe({ username: suggestedUsername });
  
        // 2) now read it
        const data = await fetchMe();
        setMe(data);
      } catch (err) {
        console.error("profile load failed:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveProfile = async (partial) => {
    const next = await updateMe({ ...me, ...partial });
    setMe(next);
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
