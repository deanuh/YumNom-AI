//this will be the test for running settings (basically app.js)
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Settings from "./pages/settings";
import Terms from "./pages/settingsInfo/terms";
import ChangePassword from "./pages/settingsInfo/changePass";
// import DeleteAccount from "./pages/settingsInfo/deleteAccount";
import EmailSettings from "./pages/settingsInfo/emailSettings";
// import Help from "./pages/settingsInfo/help";
// import PrivacyPolicy from "./pages/settingsInfo/privacyPolicy";
import LocationPref from "./pages/settingsInfo/locationPref";


function SettingsTest() {
  return (
    // the /settings/* tells the app that the settings.js file will handle the routes to the other pages
    // such as the terms.js file in settingsInfo/terms.js
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/settings" replace />} />
        <Route path="/settings/*" element={<Settings />} /> 
        <Route path="/terms" element={<Terms />} />  
        <Route path="/changePass" element={<ChangePassword />} />
        <Route path="/emailSettings" element={<EmailSettings />} /> 
        <Route path="/locationPref" element={<LocationPref />} />
         
      </Routes>
    </BrowserRouter>
  );
}

export default SettingsTest;

