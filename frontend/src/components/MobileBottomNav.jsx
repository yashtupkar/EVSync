import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Map as MapIcon, 
  Route, 
  Calendar, 
  AlertTriangle, 
  User 
} from "lucide-react";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMobile) return null;

  const navItems = [
    { label: "Map", icon: MapIcon, path: "/" },
    { label: "Planner", icon: Route, path: "/trip-planner" },
    { label: "Bookings", icon: Calendar, path: "/my-bookings" },
    { label: "Safety", icon: AlertTriangle, path: "/emergency" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-white/95 backdrop-blur-xl border-t border-gray-100/50 px-4 py-2 flex justify-between items-center pb-5 shadow-[0_-15px_50px_rgba(0,0,0,0.12)] pointer-events-auto transition-all duration-300">
      {navItems.map((item, i) => {
        const isActive = location.pathname === item.path || (item.path === "/" && location.pathname === "/discovery");
        return (
          <button 
            key={i} 
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer min-w-[64px] ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500' : 'bg-transparent'}`}>
              <item.icon size={isActive ? 20 : 18} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter transition-all `}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
