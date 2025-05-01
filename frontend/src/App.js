import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import RestaurantSearch from "./pages/restaurantSearch";
import Settings from "./pages/settings";
import UserProfilePage from "./pages/UserProfilePage";
import Favorite from "./pages/Favorite";
import ChatBot from "./pages/ChatBot";
import VotingPage from "./pages/RealTimeVoting";
import GroupMealParty from "./pages/GroupMealParty";
import AIRecommendationPage from "./pages/AIRecommendationPage";
import AIRecommendationResult from "./pages/AIRecommendationResult";

// Settings Pages
import Terms from "./pages/settingsInfo/terms";
import ChangePassword from "./pages/settingsInfo/changePass";
import DeleteAccount from "./pages/settingsInfo/deleteAccount";
import EmailSettings from "./pages/settingsInfo/emailSettings";
import Help from "./pages/settingsInfo/help";
import PrivacyPolicy from "./pages/settingsInfo/privacyPolicy";
import LocationPref from "./pages/settingsInfo/locationPref";

function App() {
  const location = useLocation();
  const hideSidebar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <div className="app-layout">
      {!hideSidebar && <Sidebar />}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/restaurantSearch" element={<RestaurantSearch />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/userprofile" element={<UserProfilePage />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/RealTimeVoting" element={<VotingPage />} />
          <Route path="/group-meal" element={<GroupMealParty />} />
          <Route path="/ai-recommendation" element={<AIRecommendationPage />} />
          <Route path="/ai-result" element={<AIRecommendationResult />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/changePass" element={<ChangePassword />} />
          <Route path="/emailSettings" element={<EmailSettings />} />
          <Route path="/locationPref" element={<LocationPref />} />
          <Route path="/deleteAccount" element={<DeleteAccount />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </div>

    // <div>
    //   <h1>YumNom AI – Firestore User Test</h1>
    //   <WriteUser />
    // </div>

    //
  );
}

function AppLayout() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppLayout;
