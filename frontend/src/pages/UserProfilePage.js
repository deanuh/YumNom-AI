import React from "react";
import UserProfileHeader from '../components/UserProfile/UserProfileHeader';
import ProfileTabs from '../components/UserProfile/ProfileTabs';
import AllergensSection from '../components/UserProfile/AllergensSection';
import FoodPreferences from '../components/UserProfile/FoodPreferences';
import RestaurantPreferences from '../components/UserProfile/RestaurantPreferences';
import GroupSettings from '../components/UserProfile/GroupSettings';
import '../styles/UserProfile.css';

const UserProfilePage = () => {
  return (
    <div className="profile-container">
      <UserProfileHeader />
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
