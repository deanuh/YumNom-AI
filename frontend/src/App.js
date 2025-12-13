import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
// for the chatbot to be used throughout the website
import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from "./pages/Dashboard";
import RestaurantSearch from "./pages/restaurantSearch";
import Settings from "./pages/settings";
import UserProfilePage from "./pages/UserProfilePage";
import Favorite from "./pages/Favorite";
import ContactUs from "./pages/ContactUs";
import ChatBot from "./pages/ChatBot";
import "./styles/ChatBot.css";
import VotingPage from "./pages/RealTimeVoting";
import GroupMealParty from "./pages/GroupMealParty";
import AIRecommendationPage from "./pages/AIRecommendationPage";
import AIRecommendationResult from "./pages/AIRecommendationResult";
import AIRestaurantResults from "./pages/AIRestaurantResults";
import AcceptInvite from "./pages/AcceptInvite";

// Settings Pages
import Terms from "./pages/settingsInfo/terms";
import ChangePassword from "./pages/settingsInfo/changePass";
import DeleteAccount from "./pages/settingsInfo/deleteAccount";
import EmailSettings from "./pages/settingsInfo/emailSettings";
import Help from "./pages/settingsInfo/help";
import PrivacyPolicy from "./pages/settingsInfo/privacyPolicy";
import LocationPref from "./pages/settingsInfo/locationPref";
import ReportIssue from "./pages/settingsInfo/ReportIssue";
import DisplaySettings from "./pages/settingsInfo/displaySettings";

function App() {
  const location = useLocation();
  const hideSidebar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/signup";

  const hideChatbot =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/signup" ||
    location.pathname === "/group-meal" ||
    location.pathname === "/RealTimeVoting";

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0); // force remount each open


  // close chatbot automatically when changing routes (no saved context)
  useEffect(() => {
    if (isChatOpen) setIsChatOpen(false);
  }, [location.pathname]);
  // toggle + remount chatbot 
  function toggleChat() {
    setIsChatOpen(prev => {
      const next = !prev;
      if (next) setChatKey(k => k + 1);
      return next;
    });
  }
  return (
    <div className="app-layout">
      {!hideSidebar && <Sidebar />}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/restaurantSearch" element={<RestaurantSearch />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/userprofile" element={<UserProfilePage />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/RealTimeVoting" element={<VotingPage />} />
          <Route path="/group-meal" element={<GroupMealParty />} />
          <Route path="/party/invite" element={<AcceptInvite />} />
          <Route path="/ai-recommendation" element={<AIRecommendationPage />} />
          <Route path="/ai-result" element={<AIRecommendationResult />} />
          <Route path="/restaurants" element={<AIRestaurantResults />} />  {/* <-- add this */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/changePass" element={<ChangePassword />} />
          <Route path="/emailSettings" element={<EmailSettings />} />
          <Route path="/locationPref" element={<LocationPref />} />
          <Route path="/deleteAccount" element={<DeleteAccount />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/ReportIssue" element={<ReportIssue />} />
          <Route path="/DisplaySettings" element={<DisplaySettings/>} />
        </Routes>
      </div>
      {!hideChatbot && (
        <>
        <button button className="chat-toggle-button" onClick={toggleChat}> Chat with NOMBOT 
        <img src="/nombot_white.png" alt="NOMBOT Icon" className="nombot-icon" />
      </button>
      {isChatOpen && (
          <div className="nombot-container">
            <ChatBot key={chatKey} toggleChat={toggleChat} />
          </div>
        )}
        </>
      )}
      
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
		<ThemeProvider>
    	<Router>
    	  <App />
    	</Router>
		</ThemeProvider>
  );
}

export default AppLayout;
