import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import DiscoveryPage from "./pages/DiscoveryPage";
import TripPlannerPage from "./pages/TripPlannerPage";
import SlotBookingPage from "./pages/SlotBookingPage";
import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import ProfilePage from "./components/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import VehicleSelectionPage from "./components/VehicleSelectionPage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster/>
      <div className="min-h-screen bg-[#F8FAF9] text-gray-900 selection:bg-[#1BAC4B] selection:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<DiscoveryPage />} />
          <Route path="/trip-planner" element={<TripPlannerPage />} />
          <Route path="/book-slot" element={<SlotBookingPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/profile"
            element={
                <ProfilePage />
             
            }
          />
          <Route
            path="/vehicle-selection"
            element={
              <ProtectedRoute>
                <VehicleSelectionPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
