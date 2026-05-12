import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  Zap, 
  MapPin, 
  IndianRupee, 
  Calendar, 
  Activity, 
  Clock, 
  User, 
  ArrowRight, 
  Scan, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  X,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  MoreVertical,
  Plus,
  Settings,
  ChevronDown
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import QRScannerModal from "../components/QRScannerModal";

const backendURL = import.meta.env.VITE_BACKEND_URL;

const HostDashboardPage = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalBookings: 0,
    activeSessions: 0,
    pendingVerifications: 0
  });
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, bookingsRes, stationsRes] = await Promise.all([
        axios.get(`${backendURL}/api/station-owner/host-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendURL}/api/station-owner/host-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendURL}/api/station-owner/my-stations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSummary(summaryRes.data.summary);
      setBookings(bookingsRes.data.bookings);
      setStations(stationsRes.data.stations);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    // Assuming decodedText is the booking ID
    navigate(`/verify-booking/${decodedText}`);
  };

  const handleStatusUpdate = async (stationId, chargerId, newStatus) => {
    try {
      const res = await axios.patch(`${backendURL}/api/stations/${stationId}/chargers/${chargerId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`Charger marked as ${newStatus}`);
        // Update local state
        setStations(prev => prev.map(s => {
          if (s._id === stationId) {
            return {
              ...s,
              chargers: s.chargers.map(c => 
                c.chargerId === chargerId ? { ...c, status: newStatus } : c
              )
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user has no home charger yet
  if (stations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
          <Zap size={48} fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Become a Host</h1>
        <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto">
          Share your home charging station with the EV community and earn rewards while supporting green energy.
        </p>
        <button 
          onClick={() => navigate("/add-home-charger")}
          className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 mx-auto"
        >
          <Plus size={20} /> List Your Home Charger
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center flex-wrap gap-2 sm:gap-3">
            Host <span className="text-emerald-500">Dashboard</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] sm:text-[10px] font-black uppercase rounded-lg tracking-widest">Host Mode</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Manage your home charging hub</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Scan size={16} /> Verify
          </button>
          <button 
            onClick={() => navigate("/add-home-charger")}
            className="p-2.5 sm:p-3 bg-white border border-slate-200 text-slate-600 rounded-xl sm:rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <SummaryCard 
          icon={<IndianRupee />} 
          label="Total Earnings" 
          value={`₹${summary.totalEarnings}`} 
          subLabel="Today"
          trend="vs yesterday"
          trendValue="0"
          lightColor="bg-emerald-50"
          textColor="text-emerald-500"
        />
        <SummaryCard 
          icon={<Calendar />} 
          label="Total Bookings" 
          value={summary.totalBookings} 
          subLabel="All time"
          trend="vs last week"
          trendValue="0"
          lightColor="bg-blue-50"
          textColor="text-blue-500"
        />
        <SummaryCard 
          icon={<Activity />} 
          label="Active Sessions" 
          value={summary.activeSessions} 
          subLabel="Live now"
          trend="vs yesterday"
          trendValue="0"
          lightColor="bg-amber-50"
          textColor="text-amber-500"
        />
        <SummaryCard 
          icon={<Clock />} 
          label="Upcoming Bookings" 
          value={summary.pendingVerifications} 
          subLabel="Next 7 days"
          trend="vs last week"
          trendValue="0"
          lightColor="bg-indigo-50"
          textColor="text-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-10">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8 sm:space-y-10">
          
          {/* Active Chargers Section */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest">My Chargers</h3>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{stations.length} Active Hubs</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {stations.map(station => (
                <HostStationCard 
                  key={station._id} 
                  station={station} 
                  onStatusUpdate={(chargerId, status) => handleStatusUpdate(station._id, chargerId, status)}
                />
              ))}
            </div>
          </section>

          {/* Recent Bookings Section */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest">Recent Bookings</h3>
              <button onClick={() => navigate("/my-bookings")} className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline">View All</button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {bookings.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {bookings.slice(0, 5).map(booking => (
                    <BookingItem key={booking._id} booking={booking} navigate={navigate} />
                  ))}
                </div>
              ) : (
                <div className="p-10 sm:p-16 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Calendar size={32} className="sm:w-10 sm:h-10" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-800">No bookings yet</h4>
                  <p className="text-slate-400 font-bold text-xs sm:text-sm mt-1.5 sm:mt-2">Your upcoming bookings will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-10">
          {/* Quick Stats/Insights */}
          <div className="bg-[#111827] rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden group min-h-[300px] sm:min-h-[350px] flex flex-col">
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-emerald-500/10 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
            
            <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 relative z-10 tracking-tight">Host Insights</h3>
            
            <div className="space-y-6 sm:space-y-8 relative z-10 flex-1">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-emerald-400 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1">Top Performance</p>
                  <p className="text-sm sm:text-base font-black">Your station is in top 20%</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-blue-400 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1">Safety Status</p>
                  <p className="text-sm sm:text-base font-black">Verified & Secure</p>
                </div>
              </div>
            </div>

            <div className="pt-6 sm:pt-8 border-t border-white/10 mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed italic font-medium">
                "Home chargers with clear house rules and high-quality photos get 3x more bookings."
              </p>
            </div>
          </div>

          {/* Security Center */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-8 shadow-sm">
            <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest mb-4 sm:mb-6">Security Center</h3>
            <div className="space-y-1 sm:space-y-2">
              <SecurityItem 
                icon={<Smartphone />} 
                title="Verify Every Booking" 
                desc="Always use the scanner or OTP for every session." 
              />
              <SecurityItem 
                icon={<AlertCircle />} 
                title="Emergency Support" 
                desc="Get help instantly in case of any emergency." 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 text-white rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-800">Keep your hub trusted & growing</h4>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5 leading-tight sm:leading-normal">Good uptime time, verified bookings and clear guidelines help you earn more.</p>
          </div>
        </div>
        <button className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-black flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-emerald-50 transition-all">
          View Best Practices <ChevronRight size={14} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

// --- Sub-Components ---

const SummaryCard = ({ icon, label, value, subLabel, trend, trendValue, color, lightColor, textColor }) => (
  <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all cursor-pointer group">
    <div className={`${lightColor} ${textColor} w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="flex flex-col min-w-0">
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">{value}</h3>
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
        <span className="text-[8px] font-bold text-slate-400">{subLabel}</span>
        <div className="flex items-center gap-1">
          <TrendingUp size={12} className="text-emerald-500" />
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">{trendValue}% <span className="text-slate-400 font-bold ml-0.5 tracking-normal lowercase">{trend}</span></span>
        </div>
      </div>
    </div>
  </div>
);

const HostStationCard = ({ station, onStatusUpdate }) => {
  const currentStatus = station.chargers?.[0]?.status || 'available';
  const chargerId = station.chargers?.[0]?.chargerId;

  const statusOptions = [
    { value: 'available', label: 'Live / Available', color: 'bg-emerald-500' },
    { value: 'occupied', label: 'Occupied', color: 'bg-amber-500' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-red-500' },
    { value: 'offline', label: 'Offline', color: 'bg-slate-400' },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-emerald-200 transition-all group">
      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-50 shadow-sm">
            {station.images?.[0] ? (
              <img src={station.images[0]} alt={station.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                 <Zap size={24} />
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm sm:text-base font-black text-slate-800 leading-tight mb-1 truncate">{station.name}</h4>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-bold">
              <MapPin size={12} className="shrink-0" /> <span className="truncate">{station.city}, {station.state}</span>
            </div>
          </div>
        </div>
        <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/50 relative">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <div className="relative pl-3">
            <select 
              value={currentStatus}
              onChange={(e) => onStatusUpdate(chargerId, e.target.value)}
              className="w-full bg-transparent text-[11px] sm:text-sm font-black text-slate-800 appearance-none focus:outline-none cursor-pointer pr-6"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <ChevronDown size={12} />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <div className={`w-1.5 h-1.5 rounded-full ${statusOptions.find(o => o.value === currentStatus)?.color || 'bg-slate-400'}`}></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Charger Type</p>
          <p className="text-[11px] sm:text-sm font-black text-slate-800 truncate">{station.chargers?.[0]?.type || 'N/A'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <IndianRupee size={14} className="font-bold" />
          <span className="text-sm sm:text-base font-black">{station.chargers?.[0]?.pricePerUnit || 0} / kWh</span>
        </div>
        <button className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest hover:text-emerald-500 flex items-center gap-1.5 transition-colors">
          <Settings size={14} className="text-slate-400" /> Settings
        </button>
      </div>
    </div>
  );
};

const BookingItem = ({ booking, navigate }) => {
  const statusColors = {
    upcoming: "bg-blue-100 text-blue-600",
    charging: "bg-amber-100 text-amber-600 animate-pulse",
    completed: "bg-emerald-100 text-emerald-600",
    cancelled: "bg-red-100 text-red-600",
  };

  return (
    <div className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/verify-booking/${booking._id}`)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
            {booking.userId?.avatar ? (
              <img src={booking.userId.avatar} alt={booking.userId.name} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="m-auto mt-2.5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs sm:text-sm font-black text-slate-800 truncate">{booking.userId?.name || 'Guest'}</h5>
            <p className="text-[10px] font-bold text-slate-400 truncate">{booking.date} • {booking.startTime}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 ${statusColors[booking.bookingStatus] || "bg-slate-100 text-slate-500"}`}>
          {booking.bookingStatus}
        </span>
      </div>
      
      <div className="flex items-center justify-between ml-13 sm:ml-15">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
            <Zap size={12} className="text-emerald-500" /> {booking.chargerId}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
            <IndianRupee size={12} className="text-slate-400" /> ₹{booking.amount}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

const SecurityItem = ({ icon, title, desc }) => (
  <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group">
    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-white group-hover:text-emerald-500 transition-colors">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-black text-slate-800 truncate">{title}</h4>
      <p className="text-[10px] font-bold text-slate-400 leading-tight mt-0.5">{desc}</p>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-all shrink-0" />
  </div>
);

export default HostDashboardPage;
