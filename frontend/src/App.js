import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import RestaurantSearch from "./pages/restaurantSearch";
import Settings from "./pages/settings";
import UserProfilePage from "./pages/UserProfilePage";
import Favorite from "./pages/Favorite";

// Settings Pages
import Terms from "./pages/settingsInfo/terms";
import ChangePassword from "./pages/settingsInfo/changePass";
import DeleteAccount from "./pages/settingsInfo/deleteAccount";
import EmailSettings from "./pages/settingsInfo/emailSettings";
import Help from "./pages/settingsInfo/help";
import PrivacyPolicy from "./pages/settingsInfo/privacyPolicy";
import LocationPref from "./pages/settingsInfo/locationPref";

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/restaurantSearch" element={<RestaurantSearch />} />
            <Route path="/settings" element={<Settings />} /> 
            <Route path="/userprofile" element={<UserProfilePage />} />
            <Route path="/restaurantSearch" element={<RestaurantSearch />} /> 
            <Route path="/favorite" element={<Favorite />} /> 
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
    </Router>
  );



  // <div>
  //   <h1>YumNom AI – Firestore User Test</h1>
  //   <WriteUser />
  // </div>

  // );
}

export default App;
