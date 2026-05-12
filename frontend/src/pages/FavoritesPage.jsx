import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, 
  MapPin, 
  Star, 
  Zap, 
  ArrowLeft, 
  ChevronRight, 
  Search,
  Trash2,
  Navigation,
  Loader2,
  Bookmark
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favoriteIds = JSON.parse(localStorage.getItem('evsync_favorites') || '[]');
      
      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Fetch all stations and filter (Efficient enough for moderate station counts)
      const res = await axios.get(`${backendURL}/api/stations`);
      if (res.data) {
        const favStations = res.data.filter(s => favoriteIds.includes(s._id));
        setFavorites(favStations);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (e, id) => {
    e.stopPropagation();
    const favoriteIds = JSON.parse(localStorage.getItem('evsync_favorites') || '[]');
    const newFavorites = favoriteIds.filter(favId => favId !== id);
    localStorage.setItem('evsync_favorites', JSON.stringify(newFavorites));
    setFavorites(prev => prev.filter(s => s._id !== id));
  };

  const filteredFavorites = favorites.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans">
     

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                <Heart size={20} fill="currentColor" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Saved <span className="text-emerald-500">Hubs</span></h1>
            </div>
            <p className="text-sm text-gray-500 font-medium">Quick access to your preferred charging locations</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search your favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-800 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <Loader2 size={40} className="text-emerald-500 animate-spin" />
             <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Favorites...</p>
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredFavorites.map((station, index) => (
                <motion.div
                  key={station._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/book-slot/${station._id}`)}
                  className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all cursor-pointer group flex flex-col gap-6 relative overflow-hidden"
                >
                  {/* Image & Status Badge */}
                  <div className="relative h-48 rounded-[1.75rem] overflow-hidden">
                    <img 
                      src={station.images?.[0] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"} 
                      alt={station.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                        {station.chargers?.filter(c => c.status === 'available').length || 0} Available
                      </div>
                      <button 
                        onClick={(e) => removeFavorite(e, station._id)}
                        className="w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-emerald-500 transition-colors">{station.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin size={12} className="text-gray-400" />
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide truncate max-w-[200px]">{station.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-black">{station.rating || "4.5"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 shadow-inner">
                          <Zap size={16} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Power</span>
                           <span className="text-sm font-black text-gray-900">{station.chargers?.[0]?.power || "60"}kW</span>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-gray-100"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shadow-inner">
                          <Navigation size={16} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Action</span>
                           <span className="text-sm font-black text-gray-900">Book Now</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Arrow */}
                  <div className="absolute bottom-6 right-6 w-12 h-12 bg-gray-50 group-hover:bg-emerald-500 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300">
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-12 md:p-24 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-8">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 relative">
              <Heart size={64} className="opacity-20" />
              <div className="absolute inset-0 border-4 border-dashed border-slate-100 rounded-full animate-[spin_20s_linear_infinite]"></div>
            </div>
            <div className="space-y-3 max-w-md">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">No Favorites Yet</h2>
              <p className="text-gray-400 font-medium">Start exploring charging stations and click the heart icon to save them here for quick access.</p>
            </div>
            <button 
              onClick={() => navigate('/discovery')}
              className="bg-emerald-500 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center gap-3"
            >
              Explore Stations <Search size={18} />
            </button>
          </div>
        )}
      </main>

      {/* Footer Helper */}
      <div className="max-w-7xl mx-auto w-full px-4 pb-12">
         <div className="bg-emerald-900 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="space-y-2 relative z-10 text-center md:text-left">
               <h3 className="text-2xl font-black tracking-tight">Smart Charging Tips</h3>
               <p className="text-emerald-300/70 text-sm font-medium">Keep your favorites updated for faster planning on your next trip.</p>
            </div>
            <Link 
              to="/discovery"
              className="bg-white text-emerald-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-50 transition-all shadow-xl relative z-10"
            >
              Back to Maps
            </Link>
         </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
