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
  Info,
  EvCharger,
  PlugZap,
  Calendar,
  ArrowLeft,
  ChevronDown,
  Check,
  Car
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveVehicle } from "../features/auth/authSlice";
import evData from "../../data/ev-data.json";

export const VehicleCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const vehicles = user?.vehicles || [];
  const activeVehicle = vehicles[activeVehicleIndex];
  
  const vehicleDetails = activeVehicle 
    ? evData.data.find(v => v.id === activeVehicle.vehicleId)
    : null;

  if (!activeVehicle) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 min-h-[160px]">
        <div className="bg-slate-50 p-4 rounded-full text-slate-300">
           <Car size={32} />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-800 text-sm">No Vehicle Added</h3>
          <p className="text-[10px] text-gray-400 font-medium">Add your EV to get accurate range</p>
        </div>
        <button 
          onClick={() => navigate("/vehicle-selection")}
          className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-green-100"
        >
          Add Vehicle
        </button>
      </div>
    );
  }

  const getVehicleImage = (type) => {
    switch(type) {
      case "car": return "/assets/ev-images/car2.png";
      case "scooter": return "/assets/ev-images/scooter3.png";
      case "three_wheeler":
      case "rickshaw":
        return "/assets/ev-images/scooter2.png";
      default: return "/assets/ev-images/car2.png";
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative">
      <div className="flex justify-between items-center">
        <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Your Vehicle</span>
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-emerald-500 font-bold text-[10px] uppercase hover:underline flex items-center gap-1"
          >
            Change
            <ChevronDown size={10} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in duration-200">
              {vehicles.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    dispatch(setActiveVehicle(idx));
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[10px] font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${idx === activeVehicleIndex ? 'text-emerald-500' : 'text-gray-600'}`}
                >
                  {v.nickname}
                  {idx === activeVehicleIndex && <Check size={10} />}
                </button>
              ))}
              <div className="h-px bg-gray-100 my-1 mx-2"></div>
              <button
                onClick={() => navigate("/vehicle-selection")}
                className="w-full text-left px-4 py-2 text-[10px] font-bold text-emerald-500 hover:bg-emerald-50 transition-colors flex items-center gap-2"
              >
                <Plus size={10} />
                Add New
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 truncate max-w-[120px]">{activeVehicle.nickname}</h3>
          <div className="flex flex-col gap-0.5">
            <p className="text-gray-400 text-[10px] font-medium truncate max-w-[120px]">{vehicleDetails?.brand} {vehicleDetails?.model}</p>
            <div className="flex gap-1.5 mt-0.5">
              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                {vehicleDetails?.dc_charger?.ports?.[0] || vehicleDetails?.ac_charger?.ports?.[0] || "Type 2"}
              </span>
              <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                {vehicleDetails?.usable_battery_size_kwh} kWh
              </span>
            </div>
          </div>
        </div>
        <div className="w-20 flex items-center justify-center">
          <img src={getVehicleImage(vehicleDetails?.vehicle_type)} alt="" className="w-full object-contain" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `78%` }}></div>
        </div>
        <div className="flex justify-between items-end mt-1">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase block">Range</span>
            <span className="text-xs font-bold text-gray-800">{vehicleDetails?.range_km || "286"} km</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-gray-400 font-bold uppercase block">Status</span>
            <span className="text-[10px] font-bold text-emerald-500 bg-green-50 px-2 py-0.5 rounded-full">Good</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReachableStationsCard = ({ total = 12, withinRange = 9, onRangeFilter }) => {
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const activeVehicle = user?.vehicles?.[activeVehicleIndex];
  const vehicleDetails = activeVehicle ? evData.data.find(v => v.id === activeVehicle.vehicleId) : null;
  const vehicleRange = vehicleDetails?.range_km || 300;

  const [battery, setBattery] = React.useState(78);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const handleCalculate = () => {
    if (battery === '') return;
    setIsCalculating(true);
    // Simulate a brief calculation delay for UX
    setTimeout(() => {
      const maxDist = (vehicleRange * (parseInt(battery) || 0)) / 100;
      onRangeFilter(maxDist);
      setIsCalculating(false);
    }, 800);
  };

  const handleReset = () => {
    onRangeFilter(null);
    setBattery(100);
  };

  return (
    <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-100 flex flex-col gap-4 relative overflow-hidden group">
      {/* Decorative Background Element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
      
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-[10px] text-white uppercase tracking-widest opacity-90">Range Check</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="text-[8px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity mr-1"
          >
            Reset
          </button>
          <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md">
            {withinRange} Hubs
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 relative z-10">
        <div className="flex-1 space-y-1.5">
          <span className="text-[8px] font-bold uppercase opacity-60 tracking-wider">Current Battery</span>
          <div className="flex items-center bg-white/10 p-2.5 rounded-xl border border-white/10 focus-within:border-white/40 focus-within:bg-white/20 transition-all group/input">
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={battery}
              placeholder="Enter %"
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setBattery(val === '' ? '' : Math.min(100, parseInt(val)));
              }}
              className="w-full bg-transparent text-sm font-bold outline-none placeholder-white/30 text-white"
            />
            <span className="text-[10px] font-black opacity-30 group-focus-within/input:opacity-60 transition-opacity uppercase ml-2 tracking-tighter">Percent</span>
          </div>
        </div>
        
        <button 
          onClick={handleCalculate}
          disabled={isCalculating || battery === ''}
          className={`bg-white text-emerald-500 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 min-w-[100px] ${
            (isCalculating || battery === '') ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          }`}
        >
          {isCalculating ? (
            <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          ) : (
            <Navigation size={14} />
          )}
          {isCalculating ? "..." : "Check"}
        </button>
      </div>

      <div className="space-y-1.5 relative z-10">
        <div className="flex justify-between text-[8px] font-black uppercase opacity-60 tracking-widest">
          <span>Network Coverage</span>
          <span>{total > 0 ? Math.round((withinRange / total) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
          <div 
            style={{ width: `${total > 0 ? (withinRange / total) * 100 : 0}%` }} 
            className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_white]"
          ></div>
        </div>
      </div>
    </div>
  );
};

export const FilterSection = ({ onShowStations }) => {
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const [selectedFilter, setSelectedFilter] = React.useState("All");
  const [isAvailableOnly, setIsAvailableOnly] = React.useState(false);

  const activeVehicle = user?.vehicles?.[activeVehicleIndex];
  const vehicleDetails = activeVehicle ? evData.data.find(v => v.id === activeVehicle.vehicleId) : null;

  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "");

  React.useEffect(() => {
    if (vehicleDetails) {
      const chargerType = vehicleDetails.dc_charger?.ports?.[0] || vehicleDetails.ac_charger?.ports?.[0];
      if (chargerType) {
        // Map common charger names to UI labels
        const labels = ["CCS2", "CHAdeMO", "Type 2", "GB/T"];
        const matchedLabel = labels.find(l => normalize(l) === normalize(chargerType));
        setSelectedFilter(matchedLabel || "All");
      } else {
        setSelectedFilter("All");
      }
    }
  }, [activeVehicleIndex, vehicleDetails]);

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-800 font-bold text-[10px] uppercase tracking-widest">Filters</span>
        <button 
          onClick={() => {
            setSelectedFilter("All");
            setIsAvailableOnly(false);
          }}
          className="text-gray-400 font-bold text-[9px] uppercase hover:text-gray-600"
        >
          Reset
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {["All", "CCS2", "CHAdeMO", "Type 2", "GB/T"].map((type) => (
            <button 
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${normalize(selectedFilter) === normalize(type) ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-500"}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
        <span className="text-[10px] font-bold text-gray-700">Available Now</span>
        <div 
          onClick={() => setIsAvailableOnly(!isAvailableOnly)}
          className={`w-10 h-5 ${isAvailableOnly ? 'bg-emerald-500' : 'bg-gray-300'} rounded-full p-0.5 relative cursor-pointer transition-colors`}
        >
          <div className={`absolute top-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isAvailableOnly ? 'right-0.5' : 'left-0.5'}`}></div>
        </div>
      </div>

      <button 
        onClick={() => onShowStations(selectedFilter, isAvailableOnly)}
        className="w-full bg-emerald-500 text-white py-3 cursor-pointer rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-green-100"
      >
        Show Matching Stations
      </button>
    </div>
  );
}


export const StationListItem = ({ station, onClick, distance }) => {
  const availableSlots = station.chargers?.filter(c => c.status === "available").length || 0;
  const totalSlots = station.chargers?.length || 0;
  const isFullyOccupied = totalSlots > 0 && availableSlots === 0;

  return (
    <div 
      onClick={onClick}
      className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-500/5 hover:border-green-500/20 transition-all cursor-pointer group"
    >
      <div className="flex gap-3 items-center mb-3">
        <div className={`w-10 h-10 ${isFullyOccupied ? 'bg-amber-500' : 'bg-emerald-500'} rounded-lg flex items-center justify-center shrink-0 transition-colors`}>
          <EvCharger size={22} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-sm text-gray-800 group-hover:text-emerald-500 transition-colors truncate">{station.name}</h3>
            <div className="flex items-center gap-0.5 text-yellow-500 font-bold text-[10px] shrink-0 ml-2">
              <Star size={10} fill="currentColor" />
              <span>{station.rating || "4.6"}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest truncate max-w-[70%]">{station.address}</p>
            {distance && (
              <span className="text-[9px] font-black text-emerald-500 bg-green-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                {distance.toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-500 rounded text-white shadow-sm">
            <PlugZap size={10} />
          </div>
          <span className="text-[10px] font-black text-gray-800 uppercase">
            {station.chargers?.[0]?.power || "60"}kW
          </span>
          <span className="text-[8px] text-gray-400 font-bold uppercase">
            {station.chargers?.[0]?.type || "CCS2"}
          </span>
        </div>
        <span className={`text-[8px] font-bold ${isFullyOccupied ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-2 py-1 rounded-lg uppercase`}>
          {isFullyOccupied ? 'Occupied' : 'Available'} ({availableSlots}/{totalSlots})
        </span>
      </div>

      {/* Book Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          alert(`Slot booked successfully for ${station.name}!`);
        }}
        className="w-full mt-3 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2"
      >
        <Calendar size={12} />
        Book Now
      </button>
    </div>
  );
};

export const QuickActionCard = ({ icon: Icon, title, desc, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group flex-1"
  >
    <div className="bg-gray-50 p-3 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
      <Icon size={20} />
    </div>
    <div className="flex-grow">
      <h4 className="font-bold text-sm text-gray-800 group-hover:text-emerald-500 transition-colors">{title}</h4>
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
        <div className="h-full bg-emerald-500" style={{ width: `${battery}%` }}></div>
      </div>
    </div>
    <div className="flex gap-2">
      <div className="bg-green-50 border border-green-100 p-3 rounded-2xl text-center min-w-[70px]">
        <span className="block text-[7px] text-gray-400 font-bold uppercase mb-1">Max Reach</span>
        <span className="text-xs font-bold text-emerald-500">{range} km</span>
      </div>
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center min-w-[70px]">
        <span className="block text-[7px] text-gray-400 font-bold uppercase mb-1">Comfort</span>
        <span className="text-xs font-bold text-blue-500">200 km</span>
      </div>
    </div>
  </div>
);

export const StationDetailView = ({ station, onClose, onNavigate }) => {
  const availableChargers = station.chargers?.filter(c => c.status === "available") || [];
  const totalChargers = station.chargers?.length || 0;

  return (
    <div className="h-full bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-80 shrink-0">
        <img 
          src={station.images?.[0] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl hover:bg-white hover:text-gray-900 transition-all font-bold text-[10px] uppercase flex items-center gap-2 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Discovery
        </button>

        <div className="absolute bottom-8 left-10 right-10">
          <div className="flex items-center gap-3 mb-3">
             <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg tracking-widest">Open Now</span>
             <div className="flex items-center gap-1.5 text-yellow-400 bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg">
               <Star size={12} fill="currentColor" />
               <span className="text-xs font-bold text-white">{station.rating || "4.5"}</span>
             </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 leading-tight">{station.name}</h2>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin size={16} className="text-emerald-500" />
            <p className="text-sm font-medium">{station.address}</p>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-10 custom-scrollbar space-y-12 pb-20">
        {/* Quick Stats & Primary Action */}
        <div className="flex justify-between items-end gap-10">
          <div className="flex gap-6">
            <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex flex-col gap-2 min-w-[140px] hover:shadow-lg transition-all">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Slots</span>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <Battery size={20} />
                 </div>
                 <span className="text-2xl font-bold text-gray-900">{availableChargers.length}<span className="text-gray-300 text-lg ml-1">/ {totalChargers}</span></span>
               </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex flex-col gap-2 min-w-[140px] hover:shadow-lg transition-all">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Power</span>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <PlugZap size={20} />
                 </div>
                 <span className="text-2xl font-bold text-gray-900">{station.chargers?.[0]?.power || "60"}<span className="text-gray-300 text-lg ml-1">kW</span></span>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onNavigate(station)}
              className="bg-emerald-500 text-sm text-white px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-green-200 hover:bg-[#189a43] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 min-w-[280px]"
            >
              <Navigation size={22} fill="white" />
              Start Driving
            </button>
            <button 
              onClick={() => alert(`Slot booked for ${station.name}!`)}
              className="bg-white text-emerald-500 text-sm border-2 border-emerald-500 px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-green-50 transition-all flex items-center justify-center gap-4 min-w-[280px]"
            >
              <Calendar size={22} />
              Book Slot
            </button>
          </div>
        </div>

        {/* Chargers Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Charging Infrastructure</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Level 3 Fast Charging Available</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {station.chargers?.map((c, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-50 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all flex justify-between items-center group">
                 <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${c.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-white`}>
                      <EvCharger size={28} />
                    </div>
                    <div>
                      <span className="block font-bold text-gray-900 text-xl">{c.type}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{c.power}kW Superfast</span>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl tracking-tighter ${c.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">Slot #{i+1}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-6">
           {[
             { icon: Clock, label: "Operating Hours", val: "Open 24/7", color: "text-purple-500", bg: "bg-purple-50" },
             { icon: MapPin, label: "Location Type", val: "Premium Lounge", color: "text-blue-500", bg: "bg-blue-50" },
             { icon: Zap, label: "Power Grid", val: "Tier 1 Stability", color: "text-amber-500", bg: "bg-amber-50" }
           ].map((item, idx) => (
             <div key={idx} className="p-6 rounded-[24px] border border-gray-100 flex items-start gap-4">
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                  <span className="text-sm font-bold text-gray-800">{item.val}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
export const NavigationOverlay = ({ info, onStop, onSimulate, isSimulating }) => (
  <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white shadow-xl flex items-center gap-6 animate-in slide-in-from-bottom-2 duration-500">
    <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-green-100 flex-shrink-0">
      <Navigation size={24} />
    </div>
    
    <div className="flex-grow space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Navigation Active</span>
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
        <span className="block text-[10px] font-black text-emerald-500">12%</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase">Usage</span>
      </div>
    </div>
  </div>
);

