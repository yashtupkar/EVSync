import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-gray-900 selection:bg-[#1BAC4B] selection:text-white">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default UserLayout;
