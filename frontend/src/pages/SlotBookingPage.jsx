import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Zap, 
  Battery, 
  Clock, 
  ChevronRight, 
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
  Leaf
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock Data
const STATION_INFO = {
  name: "New Market EcoCharge",
  status: "Open 24 Hours",
  rating: 4.6,
  reviews: 128,
  address: "NH 46, New Market, Bhopal, Madhya Pradesh 462003",
  stats: {
    power: "60 kW",
    connector: "CCS2",
    type: "DC Fast",
    availability: "24/7"
  },
  about: "New Market EcoCharge is a fast and reliable charging station with multiple DC fast chargers and AC chargers. Comfortable waiting area, restrooms and cafe available.",
  amenities: [
    { icon: Soup, label: "Restroom" },
    { icon: Coffee, label: "Cafe" },
    { icon: Wifi, label: "Wi-Fi" },
    { icon: ParkingCircle, label: "Parking" },
    { icon: Clock, label: "Waiting Area" },
    { icon: Headphones, label: "24/7 Support" }
  ],
  details: {
    operator: "EcoCharge Network",
    gstin: "23ABCDE1234F1Z5",
    contact: "+91 98765 43210",
    email: "support@ecocharges.com"
  }
};

const VEHICLES = [
  { id: 1, name: "Tesla Model 3 Long Range", battery: "78%", range: "286 km", image: "/assets/ev-images/car2.png" }
];

const SLOTS = {
  dc: [
    { id: "DC-01", status: "available", power: "60 kW", connector: "CCS2", price: 18 },
    { id: "DC-02", status: "available", power: "60 kW", connector: "CCS2", price: 18 },
    { id: "DC-03", status: "booked", power: "60 kW", connector: "CCS2", price: 18, time: "10:00 AM" },
    { id: "DC-04", status: "occupied", power: "60 kW", connector: "CCS2", price: 18, info: "In Use" },
    { id: "DC-05", status: "available", power: "60 kW", connector: "CCS2", price: 18 },
  ],
  ac: [
    { id: "AC-01", status: "available", power: "22 kW", connector: "Type 2", price: 12 },
    { id: "AC-02", status: "available", power: "22 kW", connector: "Type 2", price: 12 },
    { id: "AC-03", status: "booked", power: "22 kW", connector: "Type 2", price: 12, time: "09:30 AM" },
    { id: "AC-04", status: "maintenance", power: "22 kW", connector: "Type 2", price: 12 },
    { id: "AC-05", status: "available", power: "22 kW", connector: "Type 2", price: 12 },
  ]
};

const SlotBookingPage = () => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [selectedDate, setSelectedDate] = useState("May 21, 2024");
  const [selectedTime, setSelectedTime] = useState("All Slots");
  const [selectedSlot, setSelectedSlot] = useState("DC-02");

  const getSlotStyles = (slotId, status) => {
    const isSelected = selectedSlot === slotId;
    
    if (isSelected) return "border-[#1BAC4B] bg-[#F1F9F4] ring-1 ring-[#1BAC4B]";
    
    switch (status) {
      case "available": return "border-gray-200 bg-white hover:border-gray-300";
      case "booked": return "border-gray-100 bg-gray-50 opacity-80 cursor-not-allowed";
      case "occupied": return "border-gray-100 bg-gray-50 opacity-80 cursor-not-allowed";
      case "maintenance": return "border-gray-100 bg-gray-50 opacity-80 cursor-not-allowed";
      default: return "border-gray-200 bg-white";
    }
  };

  const getStatusIconColor = (status) => {
    switch (status) {
      case "available": return "text-[#1BAC4B]";
      case "booked": return "text-amber-500";
      case "occupied": return "text-red-500";
      case "maintenance": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen max-w-full bg-[#F8FAF9] font-sans text-gray-900 pb-20">
      {/* Top Header */}
      <div className=" mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
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
            <p className="text-[11px] font-bold text-[#1BAC4B] leading-none">Secure Booking</p>
            <p className="text-[10px] text-gray-400 mt-1">Your data is encrypted</p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 border border-green-100">
            <ShieldCheck size={16} className="text-[#1BAC4B]" />
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-[350px_1fr_400px] gap-8 mt-4">
        
        {/* Left Sidebar - Station Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="relative h-[180px]">
              <img 
                src="/src/assets/eco_charge_station.png" 
                alt="Station" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gray-100 shadow-sm">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-gray-800">{STATION_INFO.rating}</span>
                <span className="text-[10px] text-gray-400">({STATION_INFO.reviews} reviews)</span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h2 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">{STATION_INFO.name}</h2>
                <span className="text-[10px] font-bold text-[#1BAC4B] bg-[#E8F5EE] px-2 py-0.5 rounded-md border border-[#D1EBDD] whitespace-nowrap">
                  {STATION_INFO.status}
                </span>
              </div>
              
              <div className="flex items-start gap-2 mt-2.5">
                <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-normal">{STATION_INFO.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { icon: Zap, label: "Max Power", value: STATION_INFO.stats.power, color: "text-[#1BAC4B]", bg: "bg-[#F1F9F4]" },
                  { icon: CheckCircle2, label: "Connector", value: STATION_INFO.stats.connector, color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Battery, label: "Charger", value: STATION_INFO.stats.type, color: "text-[#1BAC4B]", bg: "bg-[#F1F9F4]" },
                  { icon: Clock, label: "Available", value: STATION_INFO.stats.availability, color: "text-amber-500", bg: "bg-amber-50" }
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
                  {STATION_INFO.about}
                </p>
                <button className="text-[11px] font-bold text-[#1BAC4B] mt-2 flex items-center gap-1 hover:underline">
                  Read More <ChevronRight size={14} />
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Amenities</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-3">
                  {STATION_INFO.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-gray-400">
                        <amenity.icon size={14} />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Station Details</h3>
                {Object.entries(STATION_INFO.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-[11px]">
                    <span className="capitalize text-gray-400 font-medium">{key}</span>
                    <span className="font-bold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          
          {/* Step 1: Vehicle Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1BAC4B] text-white text-[11px] font-bold">1</div>
              <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Select Your Vehicle</h2>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all group shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-5">
                <div className="w-20 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
                  <img src={VEHICLES[0].image} alt="Tesla" className="w-full h-full object-contain px-1" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">{VEHICLES[0].name}</h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {VEHICLES[0].battery} Battery • {VEHICLES[0].range} Range
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-400 transition-colors rotate-90" />
            </div>
          </section>

          {/* Step 2: Date & Time */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1BAC4B] text-white text-[11px] font-bold">2</div>
              <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Select Date & Time</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Select Date</label>
                <div className="h-12 bg-white border border-gray-200 rounded-xl px-4 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3 text-gray-800">
                    <CalendarIcon size={16} className="text-gray-400" />
                    <span className="text-sm font-bold tracking-tight">{selectedDate}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Select Time Slot</label>
                <div className="h-12 bg-white border border-gray-200 rounded-xl px-4 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3 text-gray-800">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm font-bold tracking-tight">{selectedTime}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 rotate-90" />
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Charger & Slot Selection */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1BAC4B] text-white text-[11px] font-bold">3</div>
                <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Select Charger & Slot</h2>
              </div>
              <button className="flex items-center gap-2 text-[11px] font-bold text-gray-600 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-all">
                <Filter size={14} /> Filter
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-1">
              {[
                { label: "Available", color: "bg-[#1BAC4B]" },
                { label: "Booked", color: "bg-amber-500" },
                { label: "Occupied", color: "bg-red-500" },
                { label: "Maintenance", color: "bg-gray-400" }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                  <span className="text-[11px] font-bold text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>

            {/* DC Group */}
            <div className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#1BAC4B]">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">DC Fast Chargers (CCS2)</h3>
                    <p className="text-[11px] text-gray-400 font-medium">60 kW • DC Fast Charging</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-gray-900">₹18 / kWh</p>
                  <p className="text-[10px] text-gray-400 font-medium">+ ₹5 session fee</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {SLOTS.dc.map((slot) => (
                  <button 
                    key={slot.id}
                    disabled={slot.status !== "available"}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`relative p-3.5 rounded-[22px] border text-center transition-all flex flex-col items-center gap-1 ${getSlotStyles(slot.id, slot.status)}`}
                  >
                    {selectedSlot === slot.id && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1BAC4B] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                        <CheckCircle2 size={10} strokeWidth={4} />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${slot.status === 'available' ? 'bg-[#F1F9F4]' : 'bg-gray-100'}`}>
                      <Battery size={20} className={getStatusIconColor(slot.status)} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 tracking-tight">{slot.id}</span>
                    <span className={`text-[10px] font-bold capitalize leading-none ${getStatusIconColor(slot.status)}`}>
                      {slot.status}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[8px] text-gray-400 font-medium tracking-tight leading-none">{slot.power}</p>
                      <p className="text-[8px] text-gray-400 font-medium tracking-tight leading-none">{slot.connector}</p>
                      <p className="text-[10px] font-bold text-gray-600 mt-1 leading-none">{slot.time || slot.info || `₹${slot.price}/kWh`}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AC Group */}
            <div className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#1BAC4B]">
                    <Leaf size={24} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">AC Chargers (Type 2)</h3>
                    <p className="text-[11px] text-gray-400 font-medium">22 kW • AC Charging</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-gray-900">₹12 / kWh</p>
                  <p className="text-[10px] text-gray-400 font-medium">+ ₹5 session fee</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {SLOTS.ac.map((slot) => (
                  <button 
                    key={slot.id}
                    disabled={slot.status !== "available"}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`relative p-3.5 rounded-[22px] border text-center transition-all flex flex-col items-center gap-1 ${getSlotStyles(slot.id, slot.status)}`}
                  >
                    {selectedSlot === slot.id && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1BAC4B] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                        <CheckCircle2 size={10} strokeWidth={4} />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${slot.status === 'available' ? 'bg-[#F1F9F4]' : 'bg-gray-100'}`}>
                      <Battery size={20} className={getStatusIconColor(slot.status)} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-900 tracking-tight">{slot.id}</span>
                    <span className={`text-[10px] font-bold capitalize leading-none ${getStatusIconColor(slot.status)}`}>
                      {slot.status}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[8px] text-gray-400 font-medium tracking-tight leading-none">{slot.power}</p>
                      <p className="text-[8px] text-gray-400 font-medium tracking-tight leading-none">{slot.connector}</p>
                      <p className="text-[10px] font-bold text-gray-600 mt-1 leading-none">{slot.time || slot.info || `₹${slot.price}/kWh`}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
        <div className="space-y-6">
          <div className="bg-white  rounded-xl p-6 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] sticky top-6">
            <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight mb-8">Booking Summary</h2>
            
            <div className="space-y-7">
              {/* Station Info */}
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-[#1BAC4B] shrink-0 shadow-sm">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="text-[13.5px] font-extrabold text-gray-900 leading-none tracking-tight">{STATION_INFO.name}</h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-2 leading-snug">{STATION_INFO.address}</p>
                </div>
              </div>

              {/* Selected Vehicle */}
              <div className="pt-7 border-t border-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Vehicle</h4>
                  <button className="text-[10px] font-bold text-[#1BAC4B] hover:underline">Change</button>
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
                  { label: "Charger", value: "DC-02 (CCS2)" },
                  { label: "Charger Type", value: "DC Fast Charger" },
                  { label: "Power", value: "60 kW" },
                  { label: "Date", value: "May 21, 2024", spacing: true },
                  { label: "Time", value: "10:00 AM - 11:00 AM" },
                  { label: "Duration", value: "1 hr" },
                  { label: "Price", value: "₹18 / kWh", spacing: true },
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
                  <span className="text-[14px] font-bold text-[#1BAC4B]">Est. Amount</span>
                  <span className="text-[22px] font-extrabold text-gray-900 tracking-tighter">₹365</span>
                </div>
              </div>

              {/* Green Energy Badge */}
              <div className="bg-[#F1F9F4] border border-[#D1EBDD] rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden group">
                <div className="w-9 h-9 rounded-full bg-white border border-[#D1EBDD] flex items-center justify-center text-[#1BAC4B] shrink-0 shadow-sm z-10">
                  <Leaf size={18} />
                </div>
                <div className="z-10">
                  <h4 className="text-[11.5px] font-extrabold text-[#1BAC4B] tracking-tight">Green Energy</h4>
                  <p className="text-[10px] text-green-700/70 font-bold mt-1 leading-snug">
                    This charging session will save <br /> ~4.2 kg CO₂ emissions
                  </p>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 text-[#1BAC4B] group-hover:scale-110 transition-transform">
                  <Leaf size={60} />
                </div>
              </div>

              <button className="w-full bg-[#1BAC4B] hover:bg-[#189a43] text-white font-extrabold py-4 rounded-2xl shadow-[0_8px_30px_rgba(27,172,75,0.25)] transition-all active:scale-[0.98] tracking-tight">
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

      {/* Bottom Features */}
      <div className="max-w-[1200px] mx-auto px-6 mt-16 pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { icon: ShieldCheck, label: "100% Secure Payments" },
          { icon: Headphones, label: "24/7 Customer Support" },
          { icon: Zap, label: "Instant Confirmation" },
          { icon: Clock, label: "Flexible Cancellation" }
        ].map((feature, i) => (
          <div key={i} className="flex items-center justify-center gap-3.5 group cursor-default">
            <div className="w-6 h-6 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1BAC4B] transition-colors group-hover:bg-[#1BAC4B] group-hover:text-white">
              <feature.icon size={12} strokeWidth={3} />
            </div>
            <span className="text-[11.5px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotBookingPage;
