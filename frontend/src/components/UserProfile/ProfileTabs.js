import React, { useState } from 'react';
import AllergensSection from './AllergensSection';
import FoodPreferences from './FoodPreferences';
import RestaurantPreferences from './RestaurantPreferences';
import GroupSettings from './GroupSettings';
import '../../styles/UserProfile.css';

const ProfileTabs = () => {
  const [activeTab, setActiveTab] = useState("dietary");

  const renderTabContent = () => {
    switch (activeTab) {
      case "dietary":
        return (
          <>
            <AllergensSection />
          </>
        );
      case "food":
        return <FoodPreferences />;
      case "restaurants":
        return <RestaurantPreferences />;
      case "group":
        return <GroupSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="profile-tabs">
      <div className="tab-buttons">
        <button
          className={activeTab === "dietary" ? "tab active" : "tab"}
          onClick={() => setActiveTab("dietary")}
        >
          Dietary Restrictions
        </button>
        <button
          className={activeTab === "food" ? "tab active" : "tab"}
          onClick={() => setActiveTab("food")}
        >
          Food Preferences
        </button>
        <button
          className={activeTab === "restaurants" ? "tab active" : "tab"}
          onClick={() => setActiveTab("restaurants")}
        >
          Restaurant Preferences
        </button>
        <button
          className={activeTab === "group" ? "tab active" : "tab"}
          onClick={() => setActiveTab("group")}
        >
          Group Settings
        </button>
      </div>

      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default ProfileTabs;
