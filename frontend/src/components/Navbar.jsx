import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Map, ShieldCheck, Zap, User, Route, Heart, Clock } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";
  const isLogin = location.pathname === "/login";
  const isProfile = location.pathname === "/profile";
  const isVehicle = location.pathname === "/vehicle-selection";

  // Hide navbar on auth related pages
  if (isLogin || isProfile || isVehicle) return null;

  return (
    <nav
      className="w-full px-10 py-4  flex items-center justify-between
     gap-10 shadow-[0_15px_40px_rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-xl border border-white/50 animate-in slide-in-from-top-4 duration-700"
    >
      <Link to="/" className="flex items-center gap-4 group">
        <div className="bg-[#1BAC4B] p-2.5 rounded-2xl text-white group-hover:rotate-12 transition-all shadow-lg shadow-green-100">
          <Zap size={22} fill="currentColor" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-bold text-gray-900 tracking-tighter">
            EV<span className="text-[#1BAC4B]">Sync</span>
          </span>
          <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em] mt-1 ml-0.5">
            Smart Locater
          </span>
        </div>
      </Link>

      <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>

      <div className="flex items-center gap-8">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 group relative transition-all hover:scale-105 active:scale-95`}
        >
          <div
            className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] ${location.pathname === "/" ? "text-[#1BAC4B]" : "text-gray-400 group-hover:text-gray-600"}`}
          >
            <Map size={18} /> Discovery
          </div>
          {location.pathname === "/" && (
            <div className="absolute -bottom-[26px] w-12 h-1 bg-[#1BAC4B] rounded-full shadow-[0_0_10px_rgba(27,172,75,0.4)]"></div>
          )}
        </Link>
        <Link
          to="/trip-planner"
          className={`flex flex-col items-center gap-1 group relative transition-all hover:scale-105 active:scale-95`}
        >
          <div
            className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] ${location.pathname === "/trip-planner" ? "text-[#1BAC4B]" : "text-gray-400 group-hover:text-gray-600"}`}
          >
            <Route size={18} /> Trip Planner
          </div>
          {location.pathname === "/trip-planner" && (
            <div className="absolute -bottom-[26px] w-12 h-1 bg-[#1BAC4B] rounded-full shadow-[0_0_10px_rgba(27,172,75,0.4)]"></div>
          )}
        </Link>
        <Link
          to="/favorites"
          className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 text-gray-400 hover:text-gray-600`}
        >
          <Heart size={18} /> Favorites
        </Link>
        <Link
          to="/history"
          className={`flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 text-gray-400 hover:text-gray-600`}
        >
          <Clock size={18} /> History
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/admin"
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${isAdmin ? "text-[#1BAC4B]" : "text-gray-400 hover:text-gray-600"}`}
        >
          <ShieldCheck size={16} /> Admin
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-gray-400 hover:text-gray-600"
        >
          <User size={16} /> Login
        </Link>
        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>
        <div className="relative group">
          <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-800 cursor-pointer shadow-sm group-hover:border-[#1BAC4B]/30 group-hover:shadow-lg transition-all">
            YT
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1BAC4B] border-2 border-white rounded-full shadow-lg"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
