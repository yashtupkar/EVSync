import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";

const UserLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // Don't redirect if we are on the verification page
      if (location.pathname.startsWith("/verify-booking/")) {
        return;
      }

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "station_owner") {
        navigate("/owner-dashboard");
      } else if (user.role === "operator") {
        navigate("/operator-dashboard");
      }
    }
  }, [user, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-gray-900 selection:bg-[#1BAC4B] selection:text-white">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default UserLayout;
