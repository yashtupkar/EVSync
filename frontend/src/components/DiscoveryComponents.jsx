import React from "react";
import { 
  Zap, 
  Battery, 
  MapPin, 
  Star, 
  Search, 
  Layers, 
  Plus, 
  Minus, 
  Navigation, 
  Heart, 
  Clock, 
  Route, 
  Map as MapIcon, 
  ChevronRight,
  Info
} from "lucide-react";

export const VehicleCard = ({ vehicle = "Tesla Model 3", range = "286 km", battery = 78, status = "Good", onChange }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
    <div className="flex justify-between items-center">
      <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Your Vehicle</span>
      <button onClick={onChange} className="text-[#1BAC4B] font-bold text-[10px] uppercase hover:underline">Change</button>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-800">{vehicle}</h3>
        <p className="text-gray-400 text-[10px] font-medium">Long Range AWD</p>
      </div>
      <div className="w-16 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
        <div className="w-12 h-6 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#1BAC4B]" style={{ width: `${battery}%` }}></div>
      </div>
      <div className="flex justify-between items-end mt-1">
        <div>
          <span className="text-[9px] text-gray-400 font-bold uppercase block">Range</span>
          <span className="text-xs font-bold text-gray-800">{range}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-gray-400 font-bold uppercase block">Status</span>
          <span className="text-[10px] font-bold text-[#1BAC4B] bg-green-50 px-2 py-0.5 rounded-full">{status}</span>
        </div>
      </div>
    </div>
  </div>
);

export const ReachableStationsCard = ({ total = 12, withinRange = 9 }) => (
  <div className="bg-[#1BAC4B] p-5 rounded-3xl text-white shadow-lg shadow-green-100 flex flex-col gap-3">
    <div className="flex justify-between items-center">
      <span className="font-bold text-[10px] uppercase tracking-widest">Reachable</span>
      <Zap size={16} />
    </div>
    <div className="grid grid-cols-2 gap-3 mt-1">
      <div className="flex items-center gap-2">
        <div className="bg-white/20 p-1.5 rounded-lg">
          <Zap size={14} />
        </div>
        <div>
          <span className="block text-[8px] opacity-80 uppercase font-bold">Total</span>
          <span className="text-lg font-bold">{total}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-white/20 p-1.5 rounded-lg">
          <MapPin size={14} />
        </div>
        <div>
          <span className="block text-[8px] opacity-80 uppercase font-bold">In Range</span>
          <span className="text-lg font-bold">{withinRange}</span>
        </div>
      </div>
    </div>
    <div className="mt-1">
      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-white" style={{ width: `${(withinRange / total) * 100}%` }}></div>
      </div>
    </div>
  </div>
);

export const FilterSection = ({ onShowStations }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <span className="text-gray-800 font-bold text-[10px] uppercase tracking-widest">Filters</span>
      <button className="text-gray-400 font-bold text-[9px] uppercase hover:text-gray-600">Reset</button>
    </div>
    
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {["All", "CCS2", "CHAdeMO", "Type 2"].map((type) => (
          <button 
            key={type}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${type === "All" ? "bg-[#1BAC4B] text-white" : "bg-gray-50 text-gray-500"}`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>

    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
      <span className="text-[10px] font-bold text-gray-700">Available Now</span>
      <div className="w-10 h-5 bg-[#1BAC4B] rounded-full p-0.5 relative cursor-pointer">
        <div className="absolute right-0.5 top-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
      </div>
    </div>

    <button 
      onClick={onShowStations}
      className="w-full bg-[#1BAC4B] text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-green-100"
    >
      Show 9 Stations
    </button>
  </div>
);

export const StationListItem = ({ station, onClick, distance }) => (
  <div 
    onClick={onClick}
    className="bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-bold text-sm text-gray-800 group-hover:text-[#1BAC4B] transition-colors line-clamp-1">{station.name}</h3>
      <div className="flex items-center gap-0.5 text-yellow-500 font-bold text-[10px]">
        <Star size={10} fill="currentColor" />
        <span>{station.rating || "4.6"}</span>
      </div>
    </div>
    <div className="flex justify-between items-center mb-3">
      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest line-clamp-1">{station.address}</p>
      {distance && (
        <span className="text-[10px] font-black text-[#1BAC4B] bg-green-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
          {distance.toFixed(1)} km
        </span>
      )}
    </div>
    
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-[#1BAC4B]" />
        <span className="text-[10px] font-black text-gray-800 uppercase">60kW</span>
      </div>
      <span className="text-[8px] font-bold text-[#1BAC4B] bg-green-50 px-2 py-0.5 rounded-lg uppercase">Available</span>
    </div>
  </div>
);

export const QuickActionCard = ({ icon: Icon, title, desc, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group flex-1"
  >
    <div className="bg-gray-50 p-3 rounded-xl text-[#1BAC4B] group-hover:bg-[#1BAC4B] group-hover:text-white transition-all">
      <Icon size={20} />
    </div>
    <div className="flex-grow">
      <h4 className="font-bold text-sm text-gray-800 group-hover:text-[#1BAC4B] transition-colors">{title}</h4>
      <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
    </div>
  </div>
);

export const RangeOverviewCard = ({ battery = 78, range = 286 }) => (
  <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl flex items-center gap-6">
    <div className="flex-grow space-y-2">
      <h4 className="font-bold text-xs text-gray-800">Range Overview</h4>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-800">{battery}%</span>
        <span className="text-[10px] text-gray-400 font-medium">Battery</span>
        <span className="text-xs font-bold text-gray-800 ml-2">{range} km</span>
        <span className="text-[10px] text-gray-400 font-medium">Range</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-[#1BAC4B]" style={{ width: `${battery}%` }}></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="bg-green-50 border border-green-100 p-3 rounded-2xl text-center min-w-[70px]">
        <span className="block text-[7px] text-gray-400 font-bold uppercase mb-1">Max Reach</span>
        <span className="text-xs font-bold text-[#1BAC4B]">{range} km</span>
      </div>
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center min-w-[70px]">
        <span className="block text-[7px] text-gray-400 font-bold uppercase mb-1">Comfort</span>
        <span className="text-xs font-bold text-blue-500">200 km</span>
      </div>
    </div>
  </div>
);

export const StationDetailView = ({ station, onClose, onNavigate }) => (
  <div className="h-full bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="relative h-72 shrink-0">
      <img 
        src={station.images?.[0] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"} 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white hover:text-gray-900 transition-all font-bold text-[10px] uppercase flex items-center gap-2"
      >
        <Navigation className="-rotate-90" size={16} /> Back to Map
      </button>
      <div className="absolute bottom-8 left-8 right-8 text-white">
        <h2 className="text-4xl font-bold mb-2">{station.name}</h2>
        <p className="text-white/80 font-medium">{station.address}</p>
      </div>
    </div>

    <div className="flex-grow overflow-y-auto p-10 custom-scrollbar space-y-10">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
             <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rating</span>
             <div className="flex items-center gap-2 text-[#1BAC4B] font-bold">
               <Star size={18} fill="currentColor" />
               <span className="text-xl">{station.rating || "4.5"}</span>
             </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
             <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Power</span>
             <div className="flex items-center gap-2 text-blue-500 font-bold">
               <Zap size={18} fill="currentColor" />
               <span className="text-xl">{station.chargers[0]?.power}kW</span>
             </div>
          </div>
        </div>
        <button 
          onClick={() => onNavigate(station)}
          className="bg-[#1BAC4B] text-white px-10 py-4 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:bg-[#189a43] transition-all flex items-center gap-4"
        >
          <Navigation size={20} />
          Start Driving
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100 pb-4">Available Chargers</h3>
        <div className="grid grid-cols-2 gap-4">
          {station.chargers.map((c, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-[2rem] border border-transparent hover:border-[#1BAC4B]/30 hover:bg-white hover:shadow-xl transition-all flex justify-between items-center group">
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${c.status === 'available' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'}`}></div>
                  <div>
                    <span className="block font-bold text-gray-800 text-lg">{c.type}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">{c.power}kW Fast</span>
                  </div>
               </div>
               <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl ${c.status === 'available' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                 {c.status}
               </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
export const NavigationOverlay = ({ info, onStop, onSimulate, isSimulating }) => (
  <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl flex items-center gap-6 animate-in slide-in-from-bottom-2 duration-500">
    <div className="bg-[#1BAC4B] p-4 rounded-2xl text-white shadow-lg shadow-green-100 flex-shrink-0">
      <Navigation size={24} />
    </div>
    
    <div className="flex-grow space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1BAC4B]">Navigation Active</span>
        <div className="flex gap-2">
          {!isSimulating && (
            <button 
              onClick={onSimulate}
              className="bg-blue-50 text-blue-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
            >
              Simulate Drive
            </button>
          )}
          <button 
            onClick={onStop}
            className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
          >
            Stop
          </button>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-xl font-black text-gray-800">{info?.distance || "4.2 km"}</span>
        <span className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">{info?.duration || "12 min"} remaining</span>
      </div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[200px]">
        {info?.instruction || "Continue on Main St."}
      </p>
    </div>

    <div className="flex gap-2 border-l border-gray-100 pl-6">
      <div className="text-center min-w-[60px]">
        <Clock size={16} className="mx-auto mb-1 text-gray-400" />
        <span className="block text-[10px] font-black text-gray-800">14:45</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase">Arrival</span>
      </div>
      <div className="text-center min-w-[60px]">
        <Zap size={16} className="mx-auto mb-1 text-gray-400" />
        <span className="block text-[10px] font-black text-[#1BAC4B]">12%</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase">Usage</span>
      </div>
    </div>
  </div>
);
