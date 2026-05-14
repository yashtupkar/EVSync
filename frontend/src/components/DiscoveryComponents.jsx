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
  Car,
  ChevronLeft,
  ArrowRight,
  Home
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveVehicle } from "../features/auth/authSlice";
import evData from "../../data/ev-data.json";
import {motion} from "framer-motion"

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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative shrink-0">
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

export const ReachableStationsCard = ({ total = 0, withinRange = 0, onRangeFilter }) => {
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const activeVehicle = user?.vehicles?.[activeVehicleIndex];
  const vehicleDetails = activeVehicle ? evData.data.find(v => v.id === activeVehicle.vehicleId) : null;
  const vehicleRange = vehicleDetails?.range_km || 300;

  const [battery, setBattery] = React.useState(78);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleCalculate = () => {
    if (battery === '') return;
    setIsCalculating(true);
    setTimeout(() => {
      const maxDist = (vehicleRange * (parseInt(battery) || 0)) / 100;
      onRangeFilter(maxDist);
      setIsCalculating(false);
      setHasSearched(true);
    }, 800);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    onRangeFilter(null);
    setBattery(100);
    setHasSearched(false);
    setIsExpanded(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden group shrink-0 transition-all duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 p-1.5 rounded-lg">
            <Zap size={14} className="text-emerald-500" />
          </div>
          <span className="font-bold text-[10px] text-gray-800 uppercase tracking-widest">Reachable Hubs</span>
        </div>
        {hasSearched && (
          <button 
            onClick={handleReset}
            className="text-[9px] font-bold text-emerald-500 uppercase hover:text-emerald-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {!isExpanded && !hasSearched ? (
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex flex-col gap-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 cursor-pointer hover:bg-emerald-50 transition-all group/card"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700">Check reachable hubs</span>
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm group-hover/card:translate-x-1 transition-transform">
              <ChevronDown size={12} className="text-emerald-500 -rotate-90" />
            </div>
          </div>
          <p className="text-[9px] text-gray-400 font-medium leading-tight">
            Calculate which charging stations are reachable based on your current battery percentage.
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-600">All {total} hubs visible</span>
            <div className="h-1 flex-1 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full w-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <div className="flex-1 flex items-center px-2">
              <input 
                type="text"
                inputMode="numeric"
                autoFocus
                value={battery}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setBattery(val === '' ? '' : Math.min(100, parseInt(val)));
                }}
                className="w-10 bg-transparent text-sm font-bold outline-none text-gray-800"
              />
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">% Battery</span>
            </div>
            
            <button 
              onClick={handleCalculate}
              disabled={isCalculating || battery === ''}
              className={`bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 ${
                (isCalculating || battery === '') ? "opacity-50" : "hover:bg-emerald-600 active:scale-95"
              }`}
            >
              {isCalculating ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Check"
              )}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Network Coverage</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {withinRange} / {total} Hubs
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                style={{ width: `${total > 0 ? (withinRange / total) * 100 : 0}%` }} 
                className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              ></div>
            </div>
            <p className="text-[8px] text-gray-400 font-medium italic">
              {hasSearched 
                ? `Showing hubs reachable within ${((vehicleRange * (parseInt(battery) || 0)) / 100).toFixed(0)}km`
                : "Enter battery to filter reachable hubs"
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};



export const FilterSection = ({ onShowStations, stations = [] ,open}) => {
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = React.useState(open);
  const [selectedFilter, setSelectedFilter] = React.useState("All");
  const [availability, setAvailability] = React.useState({
    now: false,
    today: false,
    occupied: false
  });
  const [powerValue, setPowerValue] = React.useState(120);
  const [distanceValue, setDistanceValue] = React.useState(20);
  const [sortBy, setSortBy] = React.useState("distance");

  const activeVehicle = user?.vehicles?.[activeVehicleIndex];
  const vehicleDetails = activeVehicle ? evData.data.find(v => v.id === activeVehicle.vehicleId) : null;

  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "");

  const handleReset = (e) => {
    e.stopPropagation();
    setSelectedFilter("All");
    setAvailability({ now: false, today: false, occupied: false });
    setPowerValue(120);
    setDistanceValue(20);
    setSortBy("distance");
    onShowStations({
      type: "All",
      availability: { now: false, today: false, occupied: false },
      power: 120,
      distance: null,
      sortBy: "distance"
    });
  };

  const handleApply = () => {
    onShowStations({
      type: selectedFilter,
      availability,
      power: powerValue,
      distance: distanceValue,
      sortBy: sortBy
    });
    // Optional: auto-collapse on apply to save space
    // setIsExpanded(false);
  };

  const counts = React.useMemo(() => {
    return {
      now: stations.filter(s => s.chargers?.some(c => c.status === "available")).length,
      today: stations.filter(s => s.chargers?.some(c => c.status === "available" || c.status === "occupied")).length,
      occupied: stations.filter(s => s.chargers?.every(c => c.status === "occupied" || c.status === "in_use")).length
    };
  }, [stations]);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 shrink-0 transition-all duration-300">
      <div 
        className="flex justify-between items-center cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
          </div>
          <h3 className="text-gray-900 font-bold text-sm">Filter Stations</h3>
        </div>
        <button 
          onClick={handleReset}
          className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-colors"
        >
          Reset
        </button>
      </div>
      
      {isExpanded && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-gray-50"></div>

          {/* Connector Type */}
          <div className="space-y-3">
            <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block">Connector Type</span>
            <div className="flex flex-wrap gap-1.5">
              {["All", "CCS2", "CHAdeMO", "Type 2", "GBT"].map((type) => (
                <button 
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    normalize(selectedFilter) === normalize(type) 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-100" 
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-3">
            <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block">Availability</span>
            <div className="space-y-2.5">
              {[
                { id: 'now', label: 'Available Now', count: counts.now },
                { id: 'today', label: 'Available Today', count: counts.today },
                { id: 'occupied', label: 'Occupied', count: counts.occupied }
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setAvailability(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="flex justify-between items-center cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                      availability[item.id] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover:border-emerald-200'
                    }`}>
                      {availability[item.id] && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-[11px] font-bold ${availability[item.id] ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">({item.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sliders in a more compact layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold text-[9px] uppercase tracking-wider">Power</span>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{powerValue} kW</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="120" 
                value={powerValue}
                onChange={(e) => setPowerValue(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold text-[9px] uppercase tracking-wider">Dist</span>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{distanceValue} km</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                value={distanceValue}
                onChange={(e) => setDistanceValue(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block">Sort Results By</span>
            <div className="flex gap-2">
              {[
                { id: 'distance', label: 'Distance', icon: Navigation },
                { id: 'rating', label: 'Top Rated', icon: Star }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setSortBy(item.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                    sortBy === item.id 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" 
                    : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={12} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleApply}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.1em] shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
};

export const FilterDropdown = ({ isOpen, onClose, onShowStations, stations = [] }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[9999] overflow-hidden origin-top-right"
      >
        <div className="">
        
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <FilterSection 
              stations={stations} 
              open={isOpen}
              onShowStations={(filters) => {
                onShowStations(filters);
                onClose();
              }} 
            />
          </div>
        </div>
      </motion.div>
    </>
  );
};





export const StationListItem = ({ station, onClick, distance }) => {
  const availableSlots = station.chargers?.filter(c => c.status === "available").length || 0;
  const totalSlots = station.chargers?.length || 0;
  const isFullyOccupied = totalSlots > 0 && availableSlots === 0;
  const navigate = useNavigate();

  const hasInstantCharger = station.chargers?.some(charger => {
    if (charger.status !== 'available') return false;
    return ['CCS2', 'TYPE 2', 'DC'].includes(charger.type?.toUpperCase());
  });

  const isHomeCharger = station.stationType === "home-charger";

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-3 rounded-xl border ${isHomeCharger ? 'border-purple-100 bg-purple-50/10' : 'border-gray-100'} shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden shrink-0`}
    >
      {isHomeCharger && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-600 text-white text-[8px] font-black uppercase tracking-tighter rounded-bl-lg shadow-sm z-10">
          Home Hub
        </div>
      )}
      <div className="flex gap-3 items-center mb-2">
        <div className={`w-8 h-8 ${isFullyOccupied ? 'bg-amber-500' : isHomeCharger ? 'bg-purple-600' : 'bg-emerald-500'} rounded-lg flex items-center justify-center shrink-0 transition-colors`}>
          {isHomeCharger ? <Home size={18} className="text-white" /> : <EvCharger size={20} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-sm text-[#1A2E35] group-hover:text-emerald-500 transition-colors truncate pr-2">{station.name}</h3>
            <div className="flex items-center gap-0.5 text-yellow-500 font-bold text-[10px] shrink-0">
              <Star size={10} fill="currentColor" />
              <span>{station.rating || "4.6"}</span>
            </div>
          </div>
          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5 truncate">{station.address}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
           <PlugZap size={10} className="text-emerald-500" />
           <span className="text-[10px] font-bold text-gray-700">{station.chargers?.[0]?.power || "60"}kW</span>
        </div>
        <span className="text-[9px] font-bold text-gray-400 uppercase">{station.chargers?.[0]?.type || "CCS2"}</span>
        
        <div className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${isFullyOccupied ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
          {isFullyOccupied ? 'Occupied' : 'Available'} ({availableSlots}/{totalSlots})
        </div>

        {distance && (
          <div className="ml-auto text-[9px] font-black text-emerald-500 bg-green-50 px-2 py-1 rounded-lg">
            {distance.toFixed(1)} km
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-2">
        {hasInstantCharger && (
          <div className="px-2 py-1 flex gap-1 rounded-lg text-[8px] font-black transition-all bg-gray-900 text-white items-center uppercase tracking-wider">
            <Zap size={10} className="text-yellow-400 fill-yellow-400" /> 
            Instant
          </div>
        )}

        <div className="flex gap-1.5 flex-1 justify-end">
          {station.external ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const lat = station.location?.coordinates[1];
                const lng = station.location?.coordinates[0];
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation size={12} />
              Navigate
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const lat = station.location?.coordinates[1];
                  const lng = station.location?.coordinates[0];
                  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                }}
                className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[9px] font-bold hover:bg-gray-100 transition-all border border-gray-100 flex items-center gap-1.5"
              >
                <Navigation size={12} />
                Route
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/book-slot/${station._id}`);
                }}
                className="flex-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar size={12} />
                Book Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};






export const HomeChargerPromoCard = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-emerald-100 p-6 rounded-2xl border border-gray-50 shadow-sm flex flex-col gap-5 shrink-0 relative overflow-hidden group">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
      
      <div className="flex justify-between relative items-start relative z-10">
        <div className="flex-1">
          <h3 className="text-[#1A2E35] font-bold text-lg leading-tight mb-2">
            Earn Money with <br /> Your Home Charger
          </h3>
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[180px]">
            List your home charger on EVSync and earn from every booking. Help build a stronger EV community.
          </p>
        </div>
        <div className="w-26 absolute -right-6 -top-0 shrink-0 ">
          <img 
            src="/assets/home-charger.png" 
            alt="Home Charger Illustration" 
            className="w-full h-full object-contain"
          />
       
        </div>
      </div>

      <div className="space-y-2.5 relative z-10">
        {[
          "Set your own price",
          "Choose your availability",
          "Safe & verified users"
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check size={10} className="text-white" strokeWidth={4} />
            </div>
            <span className="text-[11px] font-bold text-[#4A5D65]">{item}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 relative z-10">
        <button 
          onClick={() => navigate('/add-home-charger')}
          className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-[0.98]"
        >
          List Your Home Charger
        </button>
        <button className="w-full text-emerald-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:underline">
          Learn More <ArrowRight size={12} />
        </button>
      </div>
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
  const navigate = useNavigate();
  const availableChargers = station.chargers?.filter(c => c.status === "available") || [];
  const totalChargers = station.chargers?.length || 0;
  const maxPower = station.chargers?.reduce((max, c) => Math.max(max, c.power || 0), 0) || 0;
  const minPrice = station.chargers?.reduce((min, c) => Math.min(min, c.pricePerUnit || c.pricePerMinute || 999), 999);
  const dcChargers = station.chargers?.filter(c => c.type?.toUpperCase().includes("DC") || c.type?.toUpperCase().includes("CCS") || c.type?.toUpperCase().includes("CHADEMO")) || [];
  const hasDC = dcChargers.length > 0;
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [userRating, setUserRating] = React.useState(0);
  const [userComment, setUserComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useSelector((state) => state.auth);
  const chargerScrollRef = React.useRef(null);
  
  // Favorites Logic
  const [isFavorited, setIsFavorited] = React.useState(false);

  React.useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('evsync_favorites') || '[]');
    setIsFavorited(favorites.includes(station._id));
  }, [station._id]);

  const toggleFavorite = (e) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('evsync_favorites') || '[]');
    let newFavorites;
    if (favorites.includes(station._id)) {
      newFavorites = favorites.filter(id => id !== station._id);
    } else {
      newFavorites = [...favorites, station._id];
    }
    localStorage.setItem('evsync_favorites', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  const scroll = (dir) => {
    if (chargerScrollRef.current) {
      chargerScrollRef.current.scrollBy({ left: dir * 180, behavior: "smooth" });
    }
  };
    // Logic for Instant Badge
  const hasInstantCharger = station.chargers?.some(charger => {
    if (charger.status !== 'available') return false;
    return ['CCS2', 'TYPE 2', 'DC'].includes(charger.type?.toUpperCase());
  });

  const handleReviewSubmit = async () => {
    if (!user) return alert("Please login to write a review");
    if (userRating === 0) return alert("Please select a rating");
    if (!userComment.trim()) return alert("Please enter a comment");

    setIsSubmitting(true);
    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    try {
      const response = await fetch(`${backendURL}/api/stations/${station._id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          userName: user.name,
          userAvatar: user.avatar,
          rating: userRating,
          comment: userComment
        })
      });

      if (response.ok) {
        setShowReviewForm(false);
        setUserRating(0);
        setUserComment("");
        // Ideally we should update the local station object or refetch
        alert("Review added successfully!");
        window.location.reload(); // Simple way to update for now
      }
    } catch (error) {
      console.error("Error adding review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % station.images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + station.images.length) % station.images.length);
  };

  return (
    <div className="bg-white flex flex-col">
      {/* Station Header Row */}
      <div className="flex flex-col md:flex-row gap-4 p-4 md:p-5 border-b border-gray-100 items-start">
        {/* Station Image Slider */}
        <div className="w-full md:w-48 h-48 md:h-32 rounded-2xl overflow-hidden shrink-0 border border-gray-100 relative group/img">
          <img
            src={station.images?.[activeImageIndex] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"}
            alt={station.name}
            loading="lazy"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          
          {station.images?.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity"
              >
                <ChevronLeft size={16} /> 
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {station.images.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImageIndex ? 'bg-white w-3' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Station Info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Open 24/7</span>
            {hasInstantCharger && (
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                 <Zap size={8} className="fill-amber-500" /> Instant
               </span>
            )}
          </div>
          <h2 className="text-xl md:text-lg font-bold text-gray-900 leading-tight">{station.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Star size={14} fill="currentColor" className="text-yellow-400" />
            <span className="text-sm font-bold text-gray-700">{station.rating || "4.3"}</span>
            <span className="text-xs text-gray-400 font-medium">({station.reviewsCount || "124"} reviews)</span>
          </div>
          <div className="flex items-start gap-1 mt-2">
            <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[12px] md:text-[11px] text-gray-500 font-medium leading-snug">{station.address}</p>
          </div>
        </div>

        {/* Favorite & Action Buttons */}
        <div className="flex gap-2 shrink-0 self-end md:self-start">
           <button 
             onClick={toggleFavorite}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFavorited ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'} border shadow-sm hover:scale-105 active:scale-95`}
           >
             <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
           </button>
        </div>

        {/* Action Buttons */}
        <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
          {!station.external ? (
            <button
              onClick={() => navigate(`/book-slot/${station._id}`)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 text-white text-[11px] font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all whitespace-nowrap"
            >
              <Calendar size={14} />
              Book Now
            </button>
          ) : (
            <button
              onClick={() => {
                const lat = station.location?.coordinates[1];
                const lng = station.location?.coordinates[0];
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 text-white text-[11px] font-bold px-4 py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all whitespace-nowrap"
            >
              <Navigation size={14} />
              Open Maps
            </button>
          )}
          <button
            onClick={() => onNavigate(station)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold px-4 py-3 rounded-xl hover:bg-gray-50 transition-all whitespace-nowrap"
          >
            <Navigation size={14} />
            Navigate
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar px-4">
        <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg whitespace-nowrap">{maxPower} kW</span>
        <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg whitespace-nowrap">{station.chargers?.[0]?.type || "CCS2"}</span>
        {station.distance && (
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg whitespace-nowrap">{station.distance.toFixed(1)} km away</span>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 border-b border-gray-100">
        {[
          { label: "Available Slots", value: `${availableChargers.length} / ${totalChargers}`, icon: Battery, color: "text-emerald-500" },
          { label: "Max Power", value: `${maxPower} kW`, icon: Zap, color: "text-blue-500" },
          { label: "Price", value: `₹${minPrice === 999 ? "—" : minPrice}/kWh`, icon: PlugZap, color: "text-purple-500" },
          { label: "Station Type", value: hasDC ? "DC Fast" : "AC", icon: EvCharger, color: "text-amber-500" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color} shrink-0`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-sm font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      

      {/* Chargers Section */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Available Chargers</h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{hasDC ? "Level 3 Fast Charging" : "AC Charging"}</span>
        </div>

        {/* Horizontally scrollable charger cards with prev/next */}
        <div className="relative">
          <button
            onClick={() => scroll(-1)}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={13} className="text-gray-600" />
          </button>

          <div
            ref={chargerScrollRef}
            className="flex gap-3 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {station.chargers?.map((c, i) => (
              <div
                key={i}
                className={`shrink-0 w-40 rounded-2xl border p-4 flex flex-col gap-2 transition-all ${
                  c.status === "available"
                    ? "border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md"
                    : "border-amber-100 bg-amber-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.status === "available" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-500"}`}>
                    <EvCharger size={18} />
                  </div>
                  {c.status === "available" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-700">{c.chargerId || `Slot #${i+1}`}</p>
                  <p className="text-[9px] text-gray-400 font-medium uppercase">{c.type} · {c.power} kW</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg text-center ${c.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {c.status === 'in_use' || c.status === 'occupied' ? 'Occupied' : c.status}
                </span>
                <p className="text-[11px] font-bold text-gray-800">₹{c.pricePerUnit || c.pricePerMinute}/kWh</p>
                  {hasInstantCharger && (
                <div className="flex">
                  <div className="px-2 py-1 flex gap-1 rounded-sm text-[8px] transition-all bg-black text-white w-fit items-center">
                    <Zap size={10} className="text-amber-400 fill-amber-400" /> 
                    Instant
                  </div>
                </div>
              )}
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll(1)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all"
          >
            <ChevronRight size={13} className="text-gray-600" />
          </button>
        </div>

        {/* Info Note */}
        <div className={`flex items-center gap-3 mt-5 rounded-xl px-4 py-3 ${station.external ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'}`}>
          <Info size={14} className={station.external ? 'text-amber-400' : 'text-blue-400'} />
          <p className={`text-[10px] font-bold ${station.external ? 'text-amber-600' : 'text-blue-500'}`}>
            {station.external 
              ? "This station is provided by an external network. Booking via EVSync is not available for this location." 
              : "You can cancel or modify your booking up to 15 minutes before the start time."}
          </p>
        </div>

          {/* Station Image Slider */}
        <div className="w-full h-90 mt-4  rounded-xl overflow-hidden shrink-0 border border-gray-100 relative group/img">
          <img
            src={station.images?.[activeImageIndex] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"}
            alt={station.name}
            className="w-full h-full object-cover transition-transform duration-500"
          />
          
          {station.images?.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-1 cursor-pointer top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60  text-white rounded-full flex items-center justify-center "
              >
                <ChevronLeft size={18} /> 
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-1 cursor-pointer top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60  text-white rounded-full flex items-center justify-center "
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {station.images.map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${i === activeImageIndex ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-8 border-t border-gray-100 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">User Reviews</h3>
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-[10px] font-bold text-emerald-500 uppercase hover:underline"
            >
              {showReviewForm ? "Cancel" : "Write a Review"}
            </button>
          </div>

          {showReviewForm && (
            <div className="bg-gray-50 p-6 rounded-2xl border border-emerald-100 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-sm font-bold text-gray-800 mb-4">Rate your experience</h4>
              
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      size={24} 
                      fill={star <= userRating ? "#facc15" : "none"} 
                      className={star <= userRating ? "text-yellow-400" : "text-gray-300"} 
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your thoughts about this charging station..."
                className="w-full h-24 p-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none mb-4"
              />

              <button
                onClick={handleReviewSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}

          <div className="space-y-6">
            {station.reviews?.length > 0 ? (
              station.reviews.map((review, idx) => (
                <div key={idx} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {review.userAvatar ? (
                        <img 
                          src={review.userAvatar} 
                          alt={review.userName} 
                          className="w-8 h-8 rounded-full object-cover border border-emerald-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                          {review.userName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-800">{review.userName || "Anonymous"}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium italic">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
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

