import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import RestaurantSearch from "./pages/restaurantSearch";


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
