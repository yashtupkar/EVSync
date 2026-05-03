import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map, ShieldCheck, Zap, User, Route, Heart, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import {
  selectIsAuthenticated,
  selectUser,
} from "../features/auth/authSelectors";
import toast from "react-hot-toast";

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);

  const isLogin = location.pathname === "/login";
  const isProfile = location.pathname === "/profile";
  const isVehicle = location.pathname === "/vehicle-selection";
  const isDashboard = location.pathname.startsWith("/admin") || 
                      location.pathname.startsWith("/owner-dashboard") || 
                      location.pathname.startsWith("/operator-dashboard") ||
                      location.pathname.startsWith("/pending-approval");

  const userInitials =
    currentUser?.name?.slice(0, 2)?.toUpperCase() ||
    currentUser?.email?.slice(0, 2)?.toUpperCase() ||
    currentUser?.mobile?.slice(-2) ||
    "EV";

   

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logout successful");
    navigate("/login");
  }

  // Hide navbar on auth, profile, vehicle, and dashboard related pages
  if (isLogin || isProfile || isVehicle || isDashboard) return null;

  return (
    <nav
      className="w-full px-6 py-3 h-[60px] flex items-center justify-between
     gap-6 shadow-sm bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 animate-in slide-in-from-top-4 duration-700"
    >
      <Link to="/" className="flex items-center gap-3 group">
        <div className="bg-emerald-500 p-2 rounded-xl text-white group-hover:rotate-12 transition-all shadow-md shadow-green-100">
          <Zap size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xl font-bold text-gray-900 tracking-tighter">
            EV<span className="text-emerald-500">Sync</span>
          </span>
          <span className="text-[8px] font-bold uppercase text-gray-400 tracking-[0.2em] mt-1 ml-0.5">
            Smart Locater
          </span>
        </div>
      </Link>

      <div className="flex-1 flex justify-center items-center">
        <div className="flex items-center gap-8 bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
          <Link
            to="/"
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${location.pathname === "/" ? "text-emerald-500" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Map size={16} /> Discovery
          </Link>
          <div className="w-[4px] h-[4px] rounded-full bg-gray-300"></div>
          <Link
            to="/trip-planner"
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${location.pathname === "/trip-planner" ? "text-emerald-500" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Route size={16} /> Trip Planner
          </Link>
      
      
        <Link
          to="/favorites"
          className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 text-gray-400 hover:text-gray-600`}
        >
          <Heart size={18} /> Favorites
        </Link>
          <Link
            to="/my-bookings"
            className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 ${location.pathname === "/my-bookings" ? "text-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Clock size={18} /> My Bookings
          </Link>
        </div>
      </div>


      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="relative group">
            {/* Avatar Profile */}
            <div className="w-10 h-10 rounded-full bg-green-50 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-500 cursor-pointer shadow-sm group-hover:shadow-md transition-all ring-2 ring-transparent group-hover:ring-green-100 relative">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser?.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{userInitials}</span>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50">
              <div className="p-4 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{currentUser?.email || 'user@example.com'}</p>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-green-50 rounded-xl transition-colors">
                  <User size={16} /> My Profile
                </Link>
                <Link to="/favorites" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-green-50 rounded-xl transition-colors">
                  <Heart size={16} /> Saved Stations
                </Link>
                <Link to="/my-bookings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-green-50 rounded-xl transition-colors">
                  <Clock size={16} /> My Bookings
                </Link>

                {currentUser?.role === "admin" && (
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-green-50 rounded-xl transition-colors">
                    <ShieldCheck size={16} /> Admin Dashboard
                  </Link>
                )}
                {currentUser?.role === "station_owner" && (
                  <Link to={currentUser.status === 'approved' ? "/owner-dashboard" : "/pending-approval"} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-green-50 rounded-xl transition-colors">
                    <ShieldCheck size={16} /> Owner Dashboard
                  </Link>
                )}
                {currentUser?.role === "operator" && (
                  <Link to="/operator-dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-emerald-500 hover:bg-green-50 rounded-xl transition-colors">
                    <ShieldCheck size={16} /> Operator Dashboard
                  </Link>
                )}
              </div>
              <div className="p-2 border-t border-gray-50">
                <button 
                  onClick={() => handleLogout()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-xl hover:bg-[#158f3e] transition-all hover:scale-105 active:scale-95 shadow-md shadow-green-200"
          >
            <User size={16} /> Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
