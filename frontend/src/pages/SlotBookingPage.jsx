import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Zap, 
  Battery, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Wifi, 
  Coffee, 
  ShieldCheck, 
  Filter,
  Calendar as CalendarIcon,
  Car,
  Circle,
  AlertCircle,
  ParkingCircle,
  Soup,
  Headphones,
  Info,
  Lock,
  Leaf,
  ChevronDown,
  PlugZap,
  EvCharger
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getStationById } from "../api/stationApi";
import { useSelector } from "react-redux";
import evData from "../../data/ev-data.json";

// Removed mock data as it's now dynamic

const SlotBookingPage = () => {
  const navigate = useNavigate();
  const { stationId } = useParams();
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }
    return dates;
  };

  const [dates] = useState(generateDates());
  const [selectedDateObj, setSelectedDateObj] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState("All Slots");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [chargerFilter, setChargerFilter] = useState('All');

  const activeVehicle = user?.vehicles?.[activeVehicleIndex];
  const vehicleDetails = activeVehicle 
    ? evData.data.find(v => v.id === activeVehicle.vehicleId)
    : null;

  const selectedVehicle = activeVehicle ? {
    id: activeVehicle._id,
    name: `${vehicleDetails?.brand} ${vehicleDetails?.model}`,
    battery: "78%", // Mock battery for now
    range: `${vehicleDetails?.range_km} km`,
    image: vehicleDetails?.vehicle_type === 'car' ? "/assets/ev-images/car2.png" : "/assets/ev-images/scooter3.png"
  } : null;

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const response = await getStationById(stationId);
        setStation(response.data);
      } catch (error) {
        console.error("Error fetching station:", error);
      } finally {
        setLoading(false);
      }
    };
    if (stationId) fetchStation();
  }, [stationId]);

  const dcChargers = station?.chargers?.filter(c => 
    ['CCS2', 'CHADEMO', 'DC'].includes(c.type?.toUpperCase())
  ) || [];

  const acChargers = station?.chargers?.filter(c => 
    ['TYPE 2', 'AC', 'TYPE-2'].includes(c.type?.toUpperCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">Loading Station Details...</p>
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Station not found</h2>
          <button onClick={() => navigate(-1)} className="mt-4 text-emerald-500 font-bold hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const getAmenityIcon = (label) => {
    const icons = {
      restroom: Soup,
      cafe: Coffee,
      wifi: Wifi,
      parking: ParkingCircle,
      waiting: Clock,
      support: Headphones
    };
    return icons[label.toLowerCase()] || Info;
  };

  const getSlotStyles = (slotId, status) => {
    const isSelected = selectedSlot === slotId;
    
    if (isSelected) return "border-emerald-500 bg-[#F1F9F4] ring-1 ring-emerald-500 shadow-sm";
    
    switch (status) {
      case "available": return "border-gray-200 bg-white hover:border-gray-300";
      case "booked": return "border-amber-200 bg-amber-50/30 opacity-90 cursor-not-allowed";
      case "occupied": return "border-red-200 bg-red-50/30 opacity-90 cursor-not-allowed";
      case "maintenance": return "border-gray-300 bg-gray-50 opacity-80 cursor-not-allowed";
      default: return "border-gray-200 bg-white";
    }
  };

  const getStatusIconColor = (status) => {
    switch (status) {
      case "available": return "text-emerald-500";
      case "booked": return "text-amber-500";
      case "occupied": return "text-red-500";
      case "maintenance": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (station?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % station.images.length);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (station?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + station.images.length) % station.images.length);
    }
  };

  return (
    <div className="h-90vh w-full overflow-hidden bg-[#F8FAF9] font-sans text-gray-900">
      {/* Top Header */}
      <div className=" mx-auto hidden px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-600">Back to Stations</span>
        </div>
        
        <div className="text-center absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-bold text-gray-900">Book a Charging Slot</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Select your vehicle, date, time and charger slot to confirm your booking.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-[11px] font-bold text-emerald-500 leading-none">Secure Booking</p>
            <p className="text-[10px] text-gray-400 mt-1">Your data is encrypted</p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 border border-green-100">
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-[400px_1fr_350px] gap-4 mt-4">
        
        {/* Left Sidebar - Station Card */}
        <div className="space-y-6 h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-20 pt-1 px-1 -mx-1">
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="relative h-[220px] group">
              <img 
                src={station.images && station.images.length > 0 ? station.images[currentImageIndex] : "/src/assets/eco_charge_station.png"} 
                alt="Station" 
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              
              {/* Image Navigation Arrows */}
              {station.images && station.images.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-800 rounded-full shadow-md transition-all hover:bg-white hover:scale-105"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-800 rounded-full shadow-md transition-all hover:bg-white hover:scale-105"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {station.images.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} 
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gray-100 shadow-sm">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-gray-800">{station.rating || 0}</span>
                <span className="text-[10px] text-gray-400">({station.reviewsCount || 0} reviews)</span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h2 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">{station.name}</h2>
                <span className="text-[10px] font-bold text-emerald-500 bg-[#E8F5EE] px-2 py-0.5 rounded-md border border-[#D1EBDD] whitespace-nowrap capitalize">
                  {station.operatingHours ? "Open" : "Open"}
                </span>
              </div>
              
              <div className="flex items-start gap-2 mt-2.5">
                <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-normal">{station.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { icon: Zap, label: "Max Power", value: `${station.chargers?.[0]?.power || 0} kW`, color: "text-emerald-500", bg: "bg-[#F1F9F4]" },
                  { icon: CheckCircle2, label: "Connectors", value: station.chargers?.length ? `${station.chargers.length} Ports` : "N/A", color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Battery, label: "Type", value: station.stationType || "Unknown", color: "text-emerald-500", bg: "bg-[#F1F9F4]" },
                  { icon: Clock, label: "Available", value: station.operatingHours || "N/A", color: "text-amber-500", bg: "bg-amber-50" }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-3 text-center">
                    <div className={`${stat.bg} ${stat.color} w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      <stat.icon size={14} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">About Station</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-2 line-clamp-3">
                  {station.description || "No description provided."}
                </p>
                <button className="text-[11px] font-bold text-emerald-500 mt-2 flex items-center gap-1 hover:underline">
                  Read More <ChevronRight size={14} />
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Amenities</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-3">
                  {(station.amenities?.length > 0 ? station.amenities : []).map((amenity, i) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-gray-400">
                          <Icon size={14} />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                  {(!station.amenities || station.amenities.length === 0) && (
                    <span className="text-[11px] text-gray-400 italic">No amenities listed</span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Station Details</h3>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="capitalize text-gray-400 font-medium">Operator</span>
                  <span className="font-bold text-gray-800">{station.operatorName || station.ownerId?.name || "Not specified"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="capitalize text-gray-400 font-medium">Contact</span>
                  <span className="font-bold text-gray-800">{station.contactNumber || "Not available"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="capitalize text-gray-400 font-medium">Email</span>
                  <span className="font-bold text-gray-800">{station.email || "Not available"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="capitalize text-gray-400 font-medium">GST No</span>
                  <span className="font-bold text-gray-800 uppercase">{station.gstNo || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8 bg-white p-6 rounded-2xl h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-20">
          
          {/* Step 1: Vehicle Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold">1</div>
              <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Select Your Vehicle</h2>
            </div>
            
            {selectedVehicle ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all group shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
                    <img src={selectedVehicle.image} alt="Vehicle" className="w-full h-full object-contain px-1" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">{selectedVehicle.name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      {selectedVehicle.battery} Battery • {selectedVehicle.range} Range
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-400 transition-colors rotate-90" />
              </div>
            ) : (
              <div 
                onClick={() => navigate("/vehicle-selection")}
                className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-emerald-500 hover:bg-green-50 transition-all cursor-pointer"
              >
                <Car className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm font-bold text-gray-500">Add a vehicle to continue</p>
              </div>
            )}
          </section>

          {/* Step 2: Date & Time */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-bold">2</div>
              <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Select Date & Time</h2>
            </div>
            
            <div className="flex gap-8">
              {/* Left: Date Picker */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-800">May 2024</span>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={16} /></button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight size={16} /></button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {dates.map((d, i) => {
                    const isSelected = selectedDateObj.fullDate === d.fullDate;
                    return (
                      <button 
                        key={i}
                        onClick={() => setSelectedDateObj(d)}
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className={`text-[11px] font-medium ${isSelected ? 'text-green-50' : 'text-gray-400'}`}>{d.day}</span>
                        <span className={`text-[15px] font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-gray-800'}`}>{d.date}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Time Slot */}
              <div className="w-[220px] space-y-3 flex flex-col justify-end">
                <label className="text-[13px] font-bold text-gray-800 px-1">Select Time Slot</label>
                <div className="h-[60px] bg-white border border-gray-200 rounded-xl px-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3 text-gray-800">
                    <Clock size={18} className="text-gray-400" />
                    <span className="text-[14px] font-bold tracking-tight">{selectedTime}</span>
                  </div>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Charger & Slot Selection */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-bold">3</div>
                <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Select Charger & Slot</h2>
              </div>
              <button className="flex items-center gap-2 text-[13px] font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-all">
                <Filter size={16} /> Filter
              </button>
            </div>

            {/* Filter Tabs & Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setChargerFilter('All')} 
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${chargerFilter === 'All' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                >
                  All ({station.chargers?.length || 0})
                </button>
                <button 
                  onClick={() => setChargerFilter('DC')} 
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${chargerFilter === 'DC' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                >
                  DC Fast ({dcChargers.length})
                </button>
                <button 
                  onClick={() => setChargerFilter('AC')} 
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${chargerFilter === 'AC' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                >
                  AC ({acChargers.length})
                </button>
              </div>

              <div className="flex items-center gap-5">
                {[
                  { label: "Available", color: "bg-emerald-500" },
                  { label: "Booked", color: "bg-amber-500" },
                  { label: "Occupied", color: "bg-red-500" },
                  { label: "Maintenance", color: "bg-gray-400" }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                    <span className="text-[12px] font-bold text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DC Group */}
            {(chargerFilter === 'All' || chargerFilter === 'DC') && dcChargers.length > 0 && (
              <div className="space-y-4 mt-6">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                    DC Fast Chargers <span className="text-emerald-500">({dcChargers.filter(c => c.status === 'available').length} Available)</span>
                  </h3>
                  <p className="text-[13px] text-gray-400 font-medium">High speed charging for your EV</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {dcChargers.map((slot) => (
                    <button 
                      key={slot.chargerId}
                      disabled={slot.status !== "available"}
                      onClick={() => setSelectedSlot(slot.chargerId)}
                      className={`relative cursor-pointer p-3 rounded-xl border text-left transition-all flex items-start gap-4 ${getSlotStyles(slot.chargerId, slot.status)} hover:-translate-y-0.5`}
                    >
                      {selectedSlot === slot.chargerId && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-10">
                          <CheckCircle2 size={12} strokeWidth={4} />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${slot.status === 'available' ? 'bg-[#E8F5EE] text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <EvCharger size={18} />
                      </div>
                      <div className="space-y-1 w-full">
                        <span className="text-[15px] font-bold text-gray-900 tracking-tight block">{slot.chargerId}</span>
                        <p className="text-[11px] text-gray-500 font-medium tracking-tight uppercase">{slot.type} • {slot.power} kW</p>
                        <p className={`text-[12px] font-bold capitalize pt-1 ${getStatusIconColor(slot.status)}`}>
                          {slot.status}
                        </p>
                        <p className="text-[13px] font-bold text-gray-800 pt-2">₹{slot.pricePerUnit || slot.pricePerMinute}/kWh</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AC Group */}
            {(chargerFilter === 'All' || chargerFilter === 'AC') && acChargers.length > 0 && (
              <div className="space-y-4 pt-6 mt-6 border-t border-gray-100">
                <div className="flex justify-between items-center cursor-pointer group">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                      AC Chargers <span className="text-emerald-500">({acChargers.filter(c => c.status === 'available').length} Available)</span>
                    </h3>
                    <p className="text-[13px] text-gray-400 font-medium">Normal speed charging</p>
                  </div>
                  <ChevronDown size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>

                <div className="grid grid-cols-3  gap-4">
                  {acChargers.map((slot) => (
                    <button 
                      key={slot.chargerId}
                      disabled={slot.status !== "available"}
                      onClick={() => setSelectedSlot(slot.chargerId)}
                      className={`relative cursor-pointer p-3 rounded-xl border text-left transition-all flex items-start gap-4 ${getSlotStyles(slot.chargerId, slot.status)} hover:-translate-y-0.5`}
                    >
                      {selectedSlot === slot.chargerId && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-[3px] border-white shadow-sm z-10">
                          <CheckCircle2 size={12} strokeWidth={4} />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${slot.status === 'available' ? 'bg-[#E8F5EE] text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <EvCharger size={18} />
                      </div>
                      <div className="space-y-1 w-full">
                        <span className="text-[15px] font-bold text-gray-900 tracking-tight block">{slot.chargerId}</span>
                        <p className="text-[11px] text-gray-500 font-medium tracking-tight uppercase">{slot.type} • {slot.power} kW</p>
                        <p className={`text-[12px] font-bold capitalize pt-1 ${getStatusIconColor(slot.status)}`}>
                          {slot.status}
                        </p>
                        <p className="text-[13px] font-bold text-gray-800 pt-2">₹{slot.pricePerUnit || slot.pricePerMinute}/kWh</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom info section can remain unchanged below... */}

            <div className="bg-[#EEF6FF] border border-[#D8E9FF] rounded-2xl p-4 flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-white border border-[#D8E9FF] flex items-center justify-center shrink-0">
                <Info size={14} className="text-blue-500" />
              </div>
              <p className="text-[11px] font-bold text-blue-600/80 leading-relaxed">
                You can cancel your booking up to 15 minutes before the start time.
              </p>
            </div>
          </section>
        </div>

        {/* Right Sidebar - Booking Summary */}
        <div className="space-y-6 h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-20 pt-1 px-1 -mx-1">
          <div className="bg-white  rounded-xl p-6 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sticky top-6">
            <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-8">Booking Summary</h2>
            
            <div className="space-y-7">
              {/* Station Info */}
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="text-[13.5px] font-extrabold text-gray-900 leading-none tracking-tight">{station.name}</h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-2 leading-snug">{station.address}</p>
                </div>
              </div>

              {/* Selected Vehicle */}
              <div className="pt-7 border-t border-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Vehicle</h4>
                  <button className="text-[10px] font-bold text-emerald-500 hover:underline">Change</button>
                </div>
                <div className="flex items-center gap-4 bg-gray-50/80 border border-gray-100 p-2.5 rounded-2xl group cursor-pointer hover:bg-gray-100 transition-all">
                  <div className="w-16 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                    <img src={selectedVehicle.image} alt="Tesla" className="w-12 h-auto" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-[11.5px] font-bold text-gray-900 truncate tracking-tight">{selectedVehicle.name}</h5>
                    <p className="text-[9.5px] text-gray-400 font-medium mt-0.5">{selectedVehicle.battery} Battery • {selectedVehicle.range}</p>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3.5 pt-1">
                {[
                  { label: "Charger", value: selectedSlot || "Not Selected" },
                  { label: "Charger Type", value: station?.chargers?.find(c => c.chargerId === selectedSlot)?.type || "---" },
                  { label: "Power", value: `${station?.chargers?.find(c => c.chargerId === selectedSlot)?.power || "---"} kW` },
                  { label: "Date", value: selectedDateObj?.fullDate || "---", spacing: true },
                  { label: "Time", value: selectedTime },
                  { label: "Duration", value: "1 hr" },
                  { label: "Price", value: `₹${station?.chargers?.find(c => c.chargerId === selectedSlot)?.pricePerUnit || 0} / kWh`, spacing: true },
                  { label: "Session Fee", value: "₹5" }
                ].map((item, i) => (
                  <div key={i} className={`flex justify-between items-center ${item.spacing ? 'pt-4' : ''}`}>
                    <span className="text-[11.5px] text-gray-400 font-medium">{item.label}</span>
                    <span className="text-[11.5px] font-bold text-gray-800 tracking-tight">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Amount */}
              <div className="pt-7 border-t border-gray-50 space-y-3">
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="text-gray-400 font-medium">Estimated Energy</span>
                  <span className="font-bold text-gray-900 tracking-tight">~20 kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-bold text-emerald-500">Est. Amount</span>
                  <span className="text-[22px] font-extrabold text-gray-900 tracking-tighter">₹365</span>
                </div>
              </div>

              {/* Green Energy Badge */}
              <div className="bg-[#F1F9F4] border border-[#D1EBDD] rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden group">
                <div className="w-9 h-9 rounded-full bg-white border border-[#D1EBDD] flex items-center justify-center text-emerald-500 shrink-0 shadow-sm z-10">
                  <Leaf size={18} />
                </div>
                <div className="z-10">
                  <h4 className="text-[11.5px] font-extrabold text-emerald-500 tracking-tight">Green Energy</h4>
                  <p className="text-[10px] text-green-700/70 font-bold mt-1 leading-snug">
                    This charging session will save <br /> ~4.2 kg CO₂ emissions
                  </p>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Leaf size={60} />
                </div>
              </div>

              <button className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 rounded-2xl shadow-[0_8px_30px_rgba(27,172,75,0.25)] transition-all active:scale-[0.98] tracking-tight">
                Confirm Booking
              </button>

              <div className="flex items-center justify-center gap-2 text-[10.5px] text-gray-400 font-bold tracking-tight">
                <Lock size={12} strokeWidth={3} />
                <span>100% Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default SlotBookingPage;
