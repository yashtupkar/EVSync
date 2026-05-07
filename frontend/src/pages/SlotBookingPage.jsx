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
  AlertTriangle,
  ParkingCircle,
  Soup,
  Headphones,
  Info,
  Lock,
  Leaf,
  ChevronDown,
  PlugZap,
  EvCharger,
  Check,
  Heart,
  Share2,
  MessageSquare,
  Plus,
  Minus,
  Bookmark,
  History,
  Navigation
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getStationById } from "../api/stationApi";
import { getAvailableSlots, createBooking, confirmBooking } from "../api/bookingApi";
import { useSelector } from "react-redux";
import { socket } from "../utils/socket";

import evData from "../../data/ev-data.json";

// Removed mock data as it's now dynamic

const ChargerCard = ({ charger, isSelected, onSelect, isInstantAvailable }) => {
  const isAvailable = charger.status === 'available';
  const isOccupied = charger.status === 'occupied' || charger.status === 'in_use';
  const isMaintenance = charger.status === 'maintenance';
  const isBooked = charger.status === 'booked';

  // Get dynamic price from database fields
  const price = charger.pricePerUnit || charger.pricePerMinute || charger.price || 15;

  return (
    <div 
      onClick={() => isAvailable && onSelect(charger.chargerId)}
      className={`shrink-0 rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-300 cursor-pointer relative overflow-hidden ${
        isSelected 
          ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-md" 
          : isAvailable
            ? "border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md"
            : "border-gray-100 bg-gray-50/40 opacity-75 cursor-not-allowed"
      }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          isSelected || isAvailable ? "bg-emerald-50 text-emerald-600" :
          isOccupied || isBooked ? "bg-amber-50 text-amber-500" :
          "bg-red-50 text-red-500"
        }`}>
          <EvCharger size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-gray-700 truncate">{charger.chargerId}</p>
          <p className="text-[9px] text-gray-400 font-medium uppercase truncate">{charger.type} • {charger.power}kW</p>
        </div>
        {(isAvailable || isSelected) && (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isSelected ? "bg-emerald-500" : "bg-emerald-50 border border-emerald-100"
          }`}>
            {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg text-center ${
          isSelected || isAvailable ? "bg-emerald-100 text-emerald-700" :
          isOccupied || isBooked ? "bg-amber-100 text-amber-700" :
          "bg-red-100 text-red-700"
        }`}>
          {charger.status === 'in_use' || charger.status === 'occupied' ? 'Occupied' : 
           charger.status === 'booked' ? 'Booked' : charger.status}
        </span>

        <div className="flex justify-between items-center mt-1">
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rate</p>
            <p className="text-[11px] font-bold text-gray-800">₹{price}/kWh</p>
          </div>
           {isAvailable && isInstantAvailable && (
            <div 
              className={`px-2 py-1 flex gap-1 rounded-sm text-[9px]   transition-all  bg-black text-white`}
            ><Zap size={10} className="text-amber-400 fill-amber-400" /> 
           Instant
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1); // Hours
  const [selectedSlot, setSelectedSlot] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [chargerFilter, setChargerFilter] = useState('All');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [operatingHours, setOperatingHours] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [favorites, setFavorites] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Estimation state
  const [currentBattery, setCurrentBattery] = useState(20);
  const [targetBattery, setTargetBattery] = useState(80);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const userVehicles = user?.vehicles?.map(v => {
    const details = evData.data.find(d => d.id === v.vehicleId);
    return {
      id: v._id,
      name: `${details?.brand} ${details?.model}`,
      battery: "78%", // Mock for now
      range: `${details?.range_km} km`,
      image: details?.vehicle_type === 'car' ? "/assets/ev-images/car2.png" : "/assets/ev-images/scooter3.png",
      vehicleId: v.vehicleId,
      acPorts: details?.ac_charger?.ports || [],
      dcPorts: details?.dc_charger?.ports || []
    };
  }) || [];

  const selectedVehicle = userVehicles.find(v => v.id === selectedVehicleId) || userVehicles[activeVehicleIndex] || userVehicles[0];

  useEffect(() => {
    if (selectedVehicle && !selectedVehicleId) {
      setSelectedVehicleId(selectedVehicle.id);
    }
  }, [selectedVehicle, selectedVehicleId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isTimeDropdownOpen && !event.target.closest('.time-dropdown-container')) {
        setIsTimeDropdownOpen(false);
      }
      if (showVehicleDropdown && !event.target.closest('.vehicle-dropdown-container')) {
        setShowVehicleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimeDropdownOpen, showVehicleDropdown]);

  // Helper to convert time string to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  };

  // Helper to convert minutes to time string
  const minutesToTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const calculateEstimation = () => {
    if (!selectedSlot || !station) return;
    const charger = station.chargers.find(c => c.chargerId === selectedSlot);
    if (!charger) return;

    // Simplified calculation: (Battery Capacity * (Target - Current) / 100) / Power
    // Assume average battery capacity of 60kWh if not available
    const batteryCapacity = 60; 
    const energyNeeded = (batteryCapacity * (targetBattery - currentBattery)) / 100;
    const hours = energyNeeded / charger.power;
    
    // Round to nearest 0.5 hours
    const roundedHours = Math.ceil(hours * 2) / 2;
    setEstimatedDuration(roundedHours);
    setSelectedDuration(roundedHours);
  };

  const generateAvailableStartTimes = () => {
    const times = [];
    const now = new Date();
    const isToday = selectedDateObj.fullDate === now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let startMin = 0;
    let endMin = 1439; // 11:59 PM

    if (operatingHours && !operatingHours.toLowerCase().includes('24 hours')) {
      try {
        const [start, end] = operatingHours.split('-').map(t => t.trim());
        startMin = timeToMinutes(start);
        endMin = timeToMinutes(end);
      } catch (e) {
        console.error("Error parsing operating hours:", e);
      }
    }

    for (let m = startMin; m <= endMin; m += 30) {
      if (isToday && m < currentMinutes + 15) continue; // Only future times for today (with 15min buffer)
      
      const timeStr = minutesToTime(m);
      
      // Check if this start time is within any booked range
      const isBooked = bookedRanges.some(range => {
        const bStart = timeToMinutes(range.start);
        const bEnd = timeToMinutes(range.end);
        return m >= bStart && m < bEnd;
      });

      if (!isBooked) {
        times.push(timeStr);
      }
    }
    return times;
  };

  const isRangeAvailable = (startTime, durationHours, customBookedRanges = null) => {
    const startM = timeToMinutes(startTime);
    const endM = startM + (durationHours * 60);
    const rangesToCheck = customBookedRanges || bookedRanges;

    return !rangesToCheck.some(range => {
      const bStart = timeToMinutes(range.start);
      const bEnd = timeToMinutes(range.end);
      return (startM < bEnd && endM > bStart);
    });
  };

  const checkInstantAvailability = (chargerId) => {
    // If we're on the booking page, we might have bookedRanges for the selected charger
    // But we need to know if OTHER chargers are available too.
    // For now, let's assume this is only called for the selected charger's data
    // Or we'd need a way to fetch availability for all chargers.
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startTime = minutesToTime(currentMinutes);
    
    // Check if available for next 1 hour
    return isRangeAvailable(startTime, 1);
  };

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

    const savedFavorites = localStorage.getItem("evsync_favorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, [stationId]);

  useEffect(() => {
    localStorage.setItem("evsync_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (stationId) => {
    setFavorites(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId) 
        : [...prev, stationId]
    );
  };

  const handleShare = (station) => {
    const shareText = `Check out this charging station: ${station.name} - ${station.address}`;
    if (navigator.share) {
      navigator.share({
        title: station.name,
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      alert("Link copied to clipboard!");
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1593941707882-a5bba14938c7";
    if (url.startsWith("http")) return url;
    return `${backendURL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const [allChargersAvailability, setAllChargersAvailability] = useState({});

  // Fetch Available Slots when Date or Charger changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!stationId || !selectedSlot || !selectedDateObj) return;
      
      setSlotsLoading(true);
      try {
        const response = await getAvailableSlots(stationId, selectedSlot, selectedDateObj.fullDate);
        setBookedRanges(response.data.bookedRanges || []);
        setOperatingHours(response.data.operatingHours || "");
        
        // Reset selected time if it's not available in new list
        if (selectedStartTime) {
          const availableTimes = generateAvailableStartTimes();
          if (!availableTimes.includes(selectedStartTime) || !isRangeAvailable(selectedStartTime, selectedDuration)) {
            setSelectedStartTime("");
          }
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [stationId, selectedSlot, selectedDateObj]);

  // Fetch availability for ALL chargers to show instant badges
  useEffect(() => {
    const fetchAllAvailability = async () => {
      if (!stationId || !station || !selectedDateObj) return;
      
      const availability = {};
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Only check instant availability for today
      if (selectedDateObj.fullDate !== today) {
        setAllChargersAvailability({});
        return;
      }

      for (const charger of station.chargers) {
        try {
          const response = await getAvailableSlots(stationId, charger.chargerId, today);
          const ranges = response.data.bookedRanges || [];
          
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const startTime = minutesToTime(currentMinutes);
          
          // Check if available for next 1 hour
          availability[charger.chargerId] = isRangeAvailable(startTime, 1, ranges);
        } catch (e) {
          console.error(`Error fetching availability for ${charger.chargerId}:`, e);
        }
      }
      setAllChargersAvailability(availability);
    };

    fetchAllAvailability();
  }, [stationId, station?._id, selectedDateObj]);

  // Real-time slot updates via Socket.io
  useEffect(() => {
    const handleBookingConfirmed = (data) => {
      // If the confirmed booking is for the same station and charger, refresh slots
      if (data.stationId === stationId && data.chargerId === selectedSlot && data.date === selectedDateObj.fullDate) {
        const fetchSlots = async () => {
          setSlotsLoading(true);
          try {
            const response = await getAvailableSlots(stationId, selectedSlot, selectedDateObj.fullDate);
            setBookedRanges(response.data.bookedRanges || []);
            setOperatingHours(response.data.operatingHours || "");
          } catch (error) {
            console.error("Error refreshing slots via socket:", error);
          } finally {
            setSlotsLoading(false);
          }
        };
        fetchSlots();
      }
    };

    socket.on('booking_confirmed', handleBookingConfirmed);
    
    const handleChargerStatusUpdated = (data) => {
      if (data.stationId === stationId) {
        // Refresh station data to get latest charger statuses
        const fetchStation = async () => {
          try {
            const response = await getStationById(stationId);
            setStation(response.data);
          } catch (error) {
            console.error("Error refreshing station via socket:", error);
          }
        };
        fetchStation();
      }
    };

    socket.on('charger_status_updated', handleChargerStatusUpdated);

    return () => {
      socket.off('booking_confirmed', handleBookingConfirmed);
      socket.off('charger_status_updated', handleChargerStatusUpdated);
    };
  }, [stationId, selectedSlot, selectedDateObj]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInstantBooking = async () => {
    if (!selectedSlot) {
      alert("Please select a charger first");
      return;
    }

    const selectedCharger = station.chargers.find(c => c.chargerId === selectedSlot);
    if (selectedCharger?.status !== 'available') {
      alert("This charger is currently occupied or unavailable for instant booking.");
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const resLoad = await loadRazorpay();
    if (!resLoad) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    setIsProcessing(true);
    try {
      // For instant booking, we use the current time and selected duration
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startTime = minutesToTime(currentMinutes);
      const endTime = minutesToTime(currentMinutes + (selectedDuration * 60));
      
      const bookingData = {
        stationId,
        chargerId: selectedSlot,
        date: dates[0].fullDate, // Today
        startTime,
        endTime,
        amount: 1, // Production booking amount set to ₹1
        vehicleDetails: selectedVehicle ? {
          name: selectedVehicle.name,
          image: selectedVehicle.image
        } : null,
        isInstant: true
      };

      const res = await createBooking(bookingData);
      const { booking: newBooking, order } = res.data;

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "EVSync Payments",
        description: `Instant Booking for ${station.name}`,
        image: "/assets/logo.png",
        order_id: order.id,
        handler: async (response) => {
          try {
            await confirmBooking({
              bookingId: newBooking._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setIsProcessing(false);
            navigate(`/booking-success/${newBooking._id}`);
          } catch (confirmErr) {
            console.error("Confirmation error:", confirmErr);
            alert("Payment verification failed.");
            setIsProcessing(false);
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.mobile },
        theme: { color: "#10b981" },
        modal: { ondismiss: () => setIsProcessing(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Instant booking error:", error);
      alert(error.response?.data?.message || "Booking failed");
      setIsProcessing(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !selectedStartTime) {
      alert("Please select a charger and a start time");
      return;
    }

    if (!isRangeAvailable(selectedStartTime, selectedDuration)) {
      alert("The selected time range is not available. Please choose another duration or start time.");
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const resLoad = await loadRazorpay();
    if (!resLoad) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    setIsProcessing(true);
    try {
      const startTimeM = timeToMinutes(selectedStartTime);
      const endTimeM = startTimeM + (selectedDuration * 60);
      const endTime = minutesToTime(endTimeM);

      // 1. Create Pending Booking
      const bookingData = {
        stationId,
        chargerId: selectedSlot,
        date: selectedDateObj.fullDate,
        startTime: selectedStartTime,
        endTime,
        amount: 1, // Production booking amount set to ₹1
        vehicleDetails: selectedVehicle ? {
          name: selectedVehicle.name,
          image: selectedVehicle.image
        } : null
      };

      const res = await createBooking(bookingData);
      const { booking: newBooking, order } = res.data;

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "EVSync Payments",
        description: `Booking for ${station.name}`,
        image: "/assets/logo.png",
        order_id: order.id,
        handler: async (response) => {
          try {
            await confirmBooking({
              bookingId: newBooking._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setIsProcessing(false);
            navigate(`/booking-success/${newBooking._id}`);
          } catch (confirmErr) {
            console.error("Confirmation error:", confirmErr);
            alert("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.mobile
        },
        theme: {
          color: "#10b981"
        },
        modal: {
          ondismiss: () => setIsProcessing(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.message || "Booking failed");
      setIsProcessing(false);
    }
  };



  const dcChargers = station?.chargers?.filter(c => {
    const isDCCategory = ['CCS2', 'CHADEMO', 'DC'].includes(c.type?.toUpperCase());
    if (!isDCCategory) return false;
    if (selectedVehicle?.dcPorts?.length > 0) {
      return selectedVehicle.dcPorts.some(port => 
        c.type?.toUpperCase().includes(port.toUpperCase())
      );
    }
    return true;
  }) || [];

  const acChargers = station?.chargers?.filter(c => {
    const isACCategory = ['TYPE 2', 'AC', 'TYPE-2'].includes(c.type?.toUpperCase());
    if (!isACCategory) return false;
    if (selectedVehicle?.acPorts?.length > 0) {
      return selectedVehicle.acPorts.some(port => {
        const p = port.toUpperCase();
        return c.type?.toUpperCase().includes(p) || 
               c.type?.toUpperCase().includes(p.replace('TYPE', 'TYPE ')) ||
               c.type?.toUpperCase().includes(p.replace('TYPE', 'TYPE-'));
      });
    }
    return true;
  }) || [];

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
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex flex-col h-fit">
            {/* Image Header with Slider */}
            <div className="relative h-[240px] group">
              <img 
                src={getImageUrl(station.images?.[currentImageIndex])} 
                alt="Station" 
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"; }}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Navigation */}
              <button 
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:bg-white transition-all active:scale-90 z-10"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Favorite */}
              <button
                onClick={() => toggleFavorite(station._id)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-90 z-10"
              >
                <Heart size={18} className={favorites.includes(station._id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
              </button>
              
              {/* Image Navigation Arrows */}
              {station.images?.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-10"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-10"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
                    {station.images.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} 
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg uppercase">
                  {station.operatingHours || "24 HOURS"}
                </span>
                <button className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-black/70 transition-all">
                  <History size={12} /> {station.images?.length || 1} Photos
                </button>
              </div>
            </div>
            
            {/* Title & Stats */}
            <div className="p-6 pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {station.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {station.stationType || "Public"} Charging Hub
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-amber-700">{station.rating || "4.5"}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {station.reviewsCount || 0} Reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 mt-6 sticky top-0 bg-white z-20">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === "overview" ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                Overview
                {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === "reviews" ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                Reviews
                {activeTab === "reviews" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
              </button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar">
              {activeTab === "overview" ? (
                <div className="p-6 space-y-6">
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center gap-2">
                    {[
                      { icon: Navigation, label: "Route", color: "bg-[#1A73E8] text-white", onClick: () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.location.coordinates[1]},${station.location.coordinates[0]}`, "_blank") },
                      { icon: Heart, label: "Save", color: favorites.includes(station._id) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600", onClick: () => toggleFavorite(station._id) },
                      { icon: Share2, label: "Share", color: "bg-blue-50 text-blue-600", onClick: () => handleShare(station) },
                      { icon: Bookmark, label: "Bookmark", color: "bg-blue-50 text-blue-600", onClick: () => { } }
                    ].map((btn, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                        <button
                          onClick={btn.onClick}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${btn.color}`}
                        >
                          <btn.icon size={16} fill={idx === 0 ? "white" : "none"} />
                        </button>
                        <span className="text-[9px] font-bold text-center text-gray-600 leading-tight">
                          {btn.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Station Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { icon: Zap, label: "Max Power", value: `${station.chargers?.[0]?.power || 0} kW`, color: "text-emerald-500", bg: "bg-[#F1F9F4]" },
                      { icon: CheckCircle2, label: "Connectors", value: `${station.chargers?.length || 0} Ports`, color: "text-blue-500", bg: "bg-blue-50" },
                      { icon: Battery, label: "Type", value: station.stationType || "Public", color: "text-purple-500", bg: "bg-purple-50" },
                      { icon: Clock, label: "Available", value: "24 Hours", color: "text-amber-500", bg: "bg-amber-50" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center group hover:bg-white hover:border-emerald-200 transition-all">
                        <div className={`${stat.bg} ${stat.color} w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110`}>
                          <stat.icon size={16} />
                        </div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-[11px] font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Amenities */}
                  {station.amenities?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Amenities</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {station.amenities.map((amenity, i) => {
                          const Icon = getAmenityIcon(amenity);
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 border border-gray-100">
                                <Icon size={14} />
                              </div>
                              <span className="text-[11px] font-bold text-gray-600 capitalize">{amenity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Location Info */}
                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div className="flex-grow">
                        <p className="text-[11px] font-bold text-gray-700 leading-relaxed">
                          {station.address}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Exact Location</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Add Review Button */}
                  {!showReviewForm ? (
                    <button 
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[11px] border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      <MessageSquare size={16} /> Write a Review
                    </button>
                  ) : (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Your Review</h4>
                        <button onClick={() => setShowReviewForm(false)} className="text-[10px] text-gray-400 hover:text-gray-600 font-bold uppercase">Cancel</button>
                      </div>
                      
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setNewReview({...newReview, rating: star})}
                            className="transition-transform active:scale-90"
                          >
                            <Star 
                              size={20} 
                              fill={star <= newReview.rating ? "#FBBF24" : "none"} 
                              className={star <= newReview.rating ? "text-yellow-400" : "text-gray-300"}
                            />
                          </button>
                        ))}
                      </div>
                      
                      <textarea 
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                        placeholder="How was your experience?"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-emerald-500/50 min-h-[80px] font-medium"
                      />
                      
                      <button 
                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all"
                        onClick={() => {
                          alert("Review submitted! (Mock)");
                          setShowReviewForm(false);
                          setNewReview({ rating: 5, comment: "" });
                        }}
                      >
                        Submit
                      </button>
                    </div>
                  )}

                  {/* Review List */}
                  <div className="space-y-6">
                    {(station.reviews?.length > 0 ? station.reviews : [
                      { userName: "Rahul Sharma", rating: 5, comment: "Excellent fast charging station. Highly recommended!", date: "2 days ago" },
                      { userName: "Anita Desai", rating: 4, comment: "Good experience, clean location.", date: "1 week ago" }
                    ]).map((review, idx) => (
                      <div key={idx} className="space-y-2 pb-6 border-b border-gray-50 last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {review.userAvatar ? (
                              <img 
                                src={getImageUrl(review.userAvatar)} 
                                alt="" 
                                onError={(e) => { e.target.style.display = 'none'; }}
                                className="w-8 h-8 rounded-full object-cover border border-emerald-100" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                                {(review.userName || review.user?.name || review.userId?.name || "U")[0]}
                              </div>
                            )}
                            <div>
                              <h5 className="text-[11px] font-bold text-gray-900">{review.userName || review.user?.name || review.userId?.name || "Anonymous User"}</h5>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{review.date || (review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent")}</p>
                            </div>
                          </div>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={8} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium pl-11">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>

                  {(!station.reviews || station.reviews.length === 0) && (
                    <div className="flex flex-col items-center justify-center text-center py-6 opacity-60">
                      <MessageSquare size={24} className="text-gray-300 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No more reviews</p>
                    </div>
                  )}
                </div>
              )}
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
            
            <div className="relative vehicle-dropdown-container">
              {selectedVehicle ? (
                <div 
                  onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
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
                  <ChevronDown size={20} className={`text-gray-300 group-hover:text-emerald-500 transition-all ${showVehicleDropdown ? 'rotate-180' : ''}`} />
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

              {showVehicleDropdown && userVehicles.length > 1 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-h-[300px] overflow-y-auto">
                    {userVehicles.map((v) => (
                      <div 
                        key={v.id}
                        onClick={() => {
                          setSelectedVehicleId(v.id);
                          setShowVehicleDropdown(false);
                        }}
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 ${selectedVehicleId === v.id ? 'bg-emerald-50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-8 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                            <img src={v.image} alt="" className="w-full h-full object-contain px-1" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-800">{v.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{v.range}</p>
                          </div>
                        </div>
                        {selectedVehicleId === v.id && <Check size={16} className="text-emerald-500" />}
                      </div>
                    ))}
                  </div>
                  <div 
                    onClick={() => navigate("/vehicle-selection")}
                    className="p-4 bg-gray-50 text-center border-t border-gray-100 hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                      <Plus size={14} /> Manage Vehicles
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Step 2: Charger & Slot Selection */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-bold">2</div>
                <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">
                  {selectedSlot ? 'Selected Charger' : 'Select Charger & Slot'}
                </h2>
              </div>
              {selectedSlot ? (
                <button 
                  onClick={() => {
                    setSelectedSlot("");
                    setSelectedStartTime("");
                  }}
                  className="flex items-center gap-2 text-[11px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all uppercase tracking-widest"
                >
                  Change Charger
                </button>
              ) : (
                <button className="flex items-center gap-2 text-[13px] font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-all">
                  <Filter size={16} /> Filter
                </button>
              )}
            </div>

            {selectedSlot ? (
              <div className="animate-in zoom-in-95 duration-300">
                <div className="max-w-sm">
                  <ChargerCard 
                    charger={station.chargers.find(c => c.chargerId === selectedSlot)}
                    isSelected={true}
                    onSelect={() => {}}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Filter Tabs & Legend */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setChargerFilter('All')} 
                      className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${chargerFilter === 'All' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'}`}
                    >
                      All ({dcChargers.length + acChargers.length})
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
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                        DC Fast Chargers <span className="text-emerald-500">({dcChargers.filter(c => c.status === 'available').length} Available)</span>
                      </h3>
                      <p className="text-[13px] text-gray-400 font-medium">High speed charging for your EV</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dcChargers.map((slot) => (
                        <ChargerCard 
                      key={slot.chargerId}
                      charger={slot}
                      isSelected={selectedSlot === slot.chargerId}
                      onSelect={(id) => setSelectedSlot(id)}
                      isInstantAvailable={allChargersAvailability[slot.chargerId]}
                    />
                      ))}
                    </div>
                  </div>
                )}

                {/* AC Group */}
                {(chargerFilter === 'All' || chargerFilter === 'AC') && acChargers.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center cursor-pointer group">
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                          AC Chargers <span className="text-emerald-500">({acChargers.filter(c => c.status === 'available').length} Available)</span>
                        </h3>
                        <p className="text-[13px] text-gray-400 font-medium">Normal speed charging</p>
                      </div>
                      <ChevronDown size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {acChargers.map((slot) => (
                        <ChargerCard 
                          key={slot.chargerId}
                          charger={slot}
                          isSelected={selectedSlot === slot.chargerId}
                          onSelect={(id) => setSelectedSlot(id)}
                          isInstantAvailable={allChargersAvailability[slot.chargerId]}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Step 3: Date & Time */}
          <section className={`space-y-5 transition-all duration-500 ${!selectedSlot ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-bold">3</div>
              <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Select Date & Time {!selectedSlot && <span className="text-[10px] text-amber-500 ml-2">(Select charger first)</span>}</h2>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* Date Picker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-800">May 2024</span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((d, i) => {
                    const isSelected = selectedDateObj.fullDate === d.fullDate;
                    return (
                      <button 
                        key={i}
                        onClick={() => setSelectedDateObj(d)}
                        className={`min-w-[70px] flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${
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

              {/* Visual Schedule Timeline */}
              {selectedSlot && (
                <div className="space-y-3 mt-2 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Charger Schedule ({selectedSlot})</label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Free</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Booked</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                      <div className="flex gap-1 h-8 items-end">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = i;
                          const timeStr = minutesToTime(hour * 60);
                          const isBooked = bookedRanges.some(range => {
                            const bStart = timeToMinutes(range.start);
                            const bEnd = timeToMinutes(range.end);
                            const currentM = hour * 60;
                            return currentM >= bStart && currentM < bEnd;
                          });
                          
                          const now = new Date();
                          const isToday = selectedDateObj.fullDate === now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          const isPast = isToday && hour < now.getHours();

                          return (
                            <div 
                              key={i} 
                              className={`flex-1 rounded-sm relative group transition-all duration-300 ${
                                isBooked ? 'bg-amber-400 h-full shadow-sm shadow-amber-100' : 
                                isPast ? 'bg-gray-200 h-1/2' : 'bg-emerald-400 h-1/2'
                              }`}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {timeStr} {isBooked ? '(Booked)' : isPast ? '(Past)' : '(Available)'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    <div className="flex justify-between mt-2 px-0.5">
                      <span className="text-[9px] font-black text-gray-400">12 AM</span>
                      <span className="text-[9px] font-black text-gray-400">6 AM</span>
                      <span className="text-[9px] font-black text-gray-400">12 PM</span>
                      <span className="text-[9px] font-black text-gray-400">6 PM</span>
                      <span className="text-[9px] font-black text-gray-400">11 PM</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Time Selection */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-gray-800 px-1">Select Start Time</label>
                  <div className="relative time-dropdown-container">
                    <div 
                      onClick={() => !slotsLoading && selectedSlot && setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                      className={`h-[60px] bg-white border ${slotsLoading ? 'opacity-50' : ''} border-gray-200 rounded-xl px-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all ${isTimeDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-3 text-gray-800">
                        <Clock size={18} className="text-gray-400" />
                        <span className="text-[14px] font-bold tracking-tight">{selectedStartTime || "Select Start Time"}</span>
                      </div>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {isTimeDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-[250px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {slotsLoading ? (
                          <div className="p-4 text-center text-xs text-gray-400 font-bold">Loading...</div>
                        ) : !selectedSlot ? (
                          <div className="p-4 text-center text-xs text-gray-400 font-bold">Select a charger first</div>
                        ) : (
                          (() => {
                            const allTimes = [];
                            let startMin = 0;
                            let endMin = 1439;
                            if (operatingHours && !operatingHours.toLowerCase().includes('24 hours')) {
                              const [start, end] = operatingHours.split('-').map(t => t.trim());
                              startMin = timeToMinutes(start);
                              endMin = timeToMinutes(end);
                            }
                            for (let m = startMin; m <= endMin; m += 30) {
                              allTimes.push(minutesToTime(m));
                            }
                            
                            const now = new Date();
                            const isToday = selectedDateObj.fullDate === now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const currentMinutes = now.getHours() * 60 + now.getMinutes();

                            return allTimes
                              .filter(time => {
                                const m = timeToMinutes(time);
                                const isPast = isToday && m < currentMinutes + 15;
                                return !isPast; // Hide past times entirely
                              })
                              .map((time, i) => {
                                const m = timeToMinutes(time);
                                const isBooked = bookedRanges.some(range => {
                                  const bStart = timeToMinutes(range.start);
                                  const bEnd = timeToMinutes(range.end);
                                  return m >= bStart && m < bEnd;
                                });
                                
                                // Check if the entire range for the selected duration is available
                                const isRangeFree = isRangeAvailable(time, selectedDuration);
                                const isDisabled = isBooked || !isRangeFree;

                                return (
                                  <div 
                                    key={i}
                                    onClick={() => {
                                      if (!isDisabled) {
                                        setSelectedStartTime(time);
                                        setIsTimeDropdownOpen(false);
                                      }
                                    }}
                                    className={`p-4 flex justify-between items-center border-b border-gray-50 last:border-0 ${
                                      isDisabled 
                                        ? 'bg-gray-50 opacity-50 cursor-not-allowed' 
                                        : 'cursor-pointer hover:bg-gray-50'
                                    } ${selectedStartTime === time ? 'bg-emerald-50' : ''}`}
                                  >
                                    <div className="flex flex-col">
                                      <span className={`text-[13px] font-bold ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>{time}</span>
                                      {isBooked ? (
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Already Booked</span>
                                      ) : !isRangeFree ? (
                                        <div className="flex items-center gap-1">
                                          <AlertTriangle size={10} className="text-red-400" />
                                          <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Duration Overlap</span>
                                        </div>
                                      ) : null}
                                    </div>
                                    {selectedStartTime === time && <Check size={14} className="text-emerald-500" />}
                                    {isDisabled && <Lock size={12} className={isBooked ? "text-amber-400" : "text-red-300"} />}
                                  </div>
                                );
                              });
                          })()
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-gray-800 px-1">Select Duration</label>
                  <div className="flex gap-2">
                    {[1, 1.5, 2, 2.5, 3].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setSelectedDuration(dur)}
                        className={`flex-1 py-3 rounded-xl border font-bold text-[13px] transition-all ${
                          selectedDuration === dur 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {dur}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4: Duration Estimation */}
          <section className={`space-y-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 transition-all duration-500 ${!selectedSlot ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">4</div>
                <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Duration Estimator</h2>
              </div>
              <Leaf size={16} className="text-emerald-600" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Current Battery</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={currentBattery}
                    onChange={(e) => setCurrentBattery(Math.min(100, Math.max(0, e.target.value)))}
                    className="w-full p-3 bg-white border border-emerald-200 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-2 ring-emerald-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Target Battery</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={targetBattery}
                    onChange={(e) => setTargetBattery(Math.min(100, Math.max(0, e.target.value)))}
                    className="w-full p-3 bg-white border border-emerald-200 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-2 ring-emerald-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">%</span>
                </div>
              </div>
            </div>

            <button 
              onClick={calculateEstimation}
              disabled={!selectedSlot}
              className={`w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${
                selectedSlot ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Calculate Estimated Duration
            </button>

            {estimatedDuration && (
              <div className="flex items-center justify-center gap-2 text-emerald-700 bg-white/60 py-2 rounded-lg">
                <Clock size={14} />
                <span className="text-[12px] font-black uppercase tracking-tight">Estimated Time: {estimatedDuration} Hours</span>
              </div>
            )}
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
                  { label: "Start Time", value: selectedStartTime || "---" },
                  { label: "Duration", value: `${selectedDuration} hr` },
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
                  <span className="font-bold text-gray-900 tracking-tight">~{(selectedDuration * (station?.chargers?.find(c => c.chargerId === selectedSlot)?.power || 0) * 0.8).toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-bold text-emerald-500">Booking Amount</span>
                  <span className="text-[22px] font-extrabold text-gray-900 tracking-tighter">₹1</span>
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
                    This charging session will save <br /> ~{(selectedDuration * 4.2).toFixed(1)} kg CO₂ emissions
                  </p>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Leaf size={60} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleBooking}
                  disabled={isProcessing || !selectedSlot || !selectedStartTime}
                  className={`w-full cursor-pointer ${isProcessing || !selectedSlot || !selectedStartTime ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_8px_30px_rgba(16,185,129,0.2)]'} text-white font-extrabold py-4 rounded-2xl transition-all active:scale-[0.98] tracking-tight flex items-center justify-center gap-2 text-[13px]`}
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : 'Confirm Booking'}
                </button>

                {allChargersAvailability[selectedSlot] && (
                  <button 
                    onClick={handleInstantBooking}
                    disabled={isProcessing || !selectedSlot}
                    className={`w-full cursor-pointer ${isProcessing || !selectedSlot ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-400 hover:bg-amber-500 shadow-[0_8px_30px_rgba(251,191,36,0.2)]'} text-white font-extrabold py-4 rounded-2xl transition-all active:scale-[0.98] tracking-tight flex items-center justify-center gap-2 text-[13px] border border-amber-300`}
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={16} className="text-white fill-white" />
                        Instant Charge Now
                      </>
                    )}
                  </button>
                )}
              </div>


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
