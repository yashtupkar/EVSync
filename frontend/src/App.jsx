import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DiscoveryPage from "./pages/DiscoveryPage";
import TripPlannerPage from "./pages/TripPlannerPage";
import SlotBookingPage from "./pages/SlotBookingPage";
import ProfilePage from "./components/ProfilePage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import VerifyBookingPage from "./pages/VerifyBookingPage";
import ChargingProgressPage from "./pages/ChargingProgressPage";
import EmergencyPage from "./pages/EmergencyPage";
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
import AddHomeChargerPage from "./pages/AddHomeChargerPage";
import UserLayout from "./layouts/UserLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { adminSidebarItems } from "./config/adminSidebar";
import { operatorSidebarItems } from "./config/operatorSidebar";
import { Calendar, LayoutDashboard, MapPin, Settings, Wallet, Zap } from "lucide-react";
import QRScannerModal from "./components/QRScannerModal";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "./features/auth/authSelectors";
import { connectSocket, disconnectSocket } from "./utils/socket";


function App() {
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user) {
      connectSocket(user._id);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [user]);

  const StationOwnerSidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/owner-dashboard' },
    { id: 'stations', label: 'My Stations', icon: MapPin, path: '/owner-dashboard/stations' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/owner-dashboard/bookings' },
    { id: 'earnings', label: 'Earnings', icon: Wallet, path: '/owner-dashboard/earnings' },
    { id: 'chargers', label: 'Chargers', icon: Zap, path: '/owner-dashboard/chargers' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/owner-dashboard/settings' },
  ];

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage role="user" />} />
        <Route path="/owner-login" element={<LoginPage role="station_owner" />} />
        <Route path="/operator-login" element={<LoginPage role="operator" />} />
        <Route path="/admin-login" element={<LoginPage role="admin" />} />

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
          <Route path="/booking-success/:bookingId" element={<BookingSuccessPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/charging-progress/:bookingId" element={<ChargingProgressPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/add-home-charger" element={<ProtectedRoute><AddHomeChargerPage /></ProtectedRoute>} />
        </Route>
        <Route path="/verify-booking/:bookingId" element={<VerifyBookingPage />} />





        <Route element={<DashboardLayout sidebarItems={adminSidebarItems} theme="green" roleName="Global Administrator" />}>



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

        <Route element={<DashboardLayout sidebarItems={StationOwnerSidebarItems} theme="green" roleName="Station Owner" />}>
          <Route path="/owner-dashboard" element={<ProtectedRoute allowedRoles={["station_owner"]}><StationOwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner-dashboard/stations" element={<ProtectedRoute allowedRoles={["station_owner"]}><StationOwnerDashboard tab="stations" /></ProtectedRoute>} />
          <Route path="/owner-dashboard/bookings" element={<ProtectedRoute allowedRoles={["station_owner"]}><StationOwnerDashboard tab="bookings" /></ProtectedRoute>} />
          <Route path="/owner-dashboard/earnings" element={<ProtectedRoute allowedRoles={["station_owner"]}><StationOwnerDashboard tab="earnings" /></ProtectedRoute>} />
          <Route path="/owner-dashboard/chargers" element={<ProtectedRoute allowedRoles={["station_owner"]}><StationOwnerDashboard tab="chargers" /></ProtectedRoute>} />
          <Route path="/owner-dashboard/settings" element={<ProtectedRoute allowedRoles={["station_owner"]}><StationOwnerDashboard tab="settings" /></ProtectedRoute>} />
        </Route>

        <Route element={<DashboardLayout sidebarItems={operatorSidebarItems} theme="slate" roleName="On-Site Operator" />}>
          <Route
            path="/operator-dashboard"
            element={
              <ProtectedRoute allowedRoles={["operator"]}>
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
       
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
