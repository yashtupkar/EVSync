import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DiscoveryPage from "./pages/DiscoveryPage";
import TripPlannerPage from "./pages/TripPlannerPage";
import SlotBookingPage from "./pages/SlotBookingPage";
import ProfilePage from "./components/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import VehicleSelectionPage from "./components/VehicleSelectionPage";
import PendingApprovalPage from "./components/PendingApprovalPage";
import { Toaster } from "react-hot-toast";
import AdminPanel from "./pages/AdminPanel";
import AdminStationRequestsPage from "./pages/AdminStationRequestsPage";
import AdminStationsManagementPage from "./pages/AdminStationsManagementPage";
import StationOwnerDashboard from "./pages/StationOwnerDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import LoginPage from "./pages/LoginPage";
import AddStationPage from "./pages/AddStationPage";
import UserLayout from "./layouts/UserLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { adminSidebarItems } from "./config/adminSidebar";

function App() {
  return (
    <Router>
      <Toaster/>
      <Routes>
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
          <Route element={<UserLayout />}>
            <Route path="/" element={<DiscoveryPage />} />
          <Route path="/trip-planner" element={<TripPlannerPage />} />
          <Route path="/book-slot/:stationId" element={<SlotBookingPage />} />
          </Route>

          <Route element={<DashboardLayout sidebarItems={adminSidebarItems} theme="green" roleName="Global Administrator"/>}>
          
         
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/station-requests"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminStationRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stations"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminStationsManagementPage />
              </ProtectedRoute>
            }
          />
           </Route>
          <Route
            path="/pending-approval"
            element={
              <ProtectedRoute allowedRoles={["station_owner"]}>
                <PendingApprovalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-station"
            element={
              <ProtectedRoute allowedRoles={["station_owner"]}>
                <AddStationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-dashboard"
            element={
              <ProtectedRoute allowedRoles={["station_owner"]}>
                <StationOwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator-dashboard"
            element={
              <ProtectedRoute allowedRoles={["operator"]}>
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
       
        </Routes>
    </Router>
  );
}

export default App;
