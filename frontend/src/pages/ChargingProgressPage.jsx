import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { socket } from '../utils/socket';
import axios from 'axios';
import { 
  Zap, 
  Battery, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  Timer, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Navigation,
  FileText,
  Trash2,
  MoreVertical,
  Bell,
  Search,
  HelpCircle,
  Settings,
  LayoutDashboard,
  Calendar,
  History,
  Heart,
  Wallet,
  Headphones,
  Copy,
  ChevronRight,
  Info,
  Leaf,
  Activity,
  Car
} from 'lucide-react';
import { motion } from 'framer-motion';

const ChargingProgressPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentKwh, setCurrentKwh] = useState(0);
  const [status, setStatus] = useState('initializing');
  const [message, setMessage] = useState('Connecting to charger...');
  
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const b = res.data.booking;
          setBooking(b);
          setProgress(b.percentage || 0);
          setCurrentKwh(b.currentKwh || 0);
          setStatus(b.bookingStatus);
          setMessage(b.statusMessage || 'Ready to charge');
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();

    const handleUpdate = (data) => {
      if (data.bookingId === bookingId) {
        setProgress(data.percentage);
        setCurrentKwh(data.currentKwh);
        setStatus(data.status);
        if (data.status === 'completed') {
          setMessage('Charging completed successfully!');
        } else if (data.status === 'charging') {
          setMessage('Your vehicle is charging. Monitor your session in real-time.');
        }
      }
    };

    socket.on('charging_update', handleUpdate);
    return () => socket.off('charging_update', handleUpdate);
  }, [bookingId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold tracking-tight">Syncing with Station...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Session Not Found</h2>
          <p className="text-gray-500 mt-2 font-medium">This charging session could not be retrieved. It might have been archived or deleted.</p>
          <button onClick={() => navigate('/my-bookings')} className="mt-8 w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs">Back to Bookings</button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Discovery', path: '/' },
    { icon: Navigation, label: 'Trip Planner', path: '/trip-planner' },
    { icon: Calendar, label: 'My Bookings', path: '/my-bookings', active: true },
    { icon: History, label: 'Charging History', path: '#' },
    { icon: Heart, label: 'Favorites', path: '#' },
    { icon: Wallet, label: 'Wallet', path: '#' },
    { icon: Headphones, label: 'Support', path: '#' },
    { icon: Settings, label: 'Settings', path: '#' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex font-sans text-gray-900">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-screen hidden lg:flex">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Zap size={22} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">EVSync</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Smart Locater</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${item.active ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <item.icon size={20} className={item.active ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'} />
              <span className="text-[13px] tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto bg-gray-50 border border-gray-100 rounded-[2rem] p-5 relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-[13px] font-black text-emerald-600 mb-1">Drive Green, Live Clean</h4>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Thank you for choosing sustainable mobility. 🌱</p>
          </div>
          <img src="/assets/ev-images/car2.png" alt="car" className="w-32 absolute -right-6 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* TOP BAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-50 flex items-center justify-end px-8 sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 text-gray-400">
              <HelpCircle size={20} className="hover:text-gray-600 cursor-pointer" />
              <div className="relative">
                <Bell size={20} className="hover:text-gray-600 cursor-pointer" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">3</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[12px] font-black text-gray-900 leading-none">{user?.name || 'Guest User'}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Premium Member</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} alt="avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
          {/* CENTER PANEL */}
          <div className="space-y-8">
            {/* SESSION HEADER */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <Zap size={28} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Charging in Progress</h2>
                  <p className="text-sm text-gray-400 font-medium mt-1">{message}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Session ID</p>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <span className="text-sm font-black text-gray-800 tracking-widest uppercase">S-{booking._id.slice(-10).toUpperCase()}</span>
                  <Copy size={14} className="text-gray-300 hover:text-gray-600 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* HERO SECTION */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 flex flex-col justify-center relative">
                <img src="/ev_charging_dashboard_hero.png" alt="Car" className="w-full h-auto object-contain relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/20 to-transparent"></div>
              </div>
              
              <div className="p-10 bg-gray-50/50 flex flex-col justify-center space-y-8 border-l border-gray-50">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Battery Status</h3>
                
                <div className="space-y-6">
                  {/* BATTERY VISUAL */}
                  <div className="relative h-24 w-full bg-white border-2 border-gray-200 rounded-[1.5rem] p-2 flex items-center overflow-hidden">
                    <div 
                      className={`h-full rounded-xl transition-all duration-1000 ease-in-out relative flex items-center justify-center ${progress > 20 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 15 && <Zap size={24} className="text-white fill-white animate-pulse" />}
                    </div>
                    {/* Battery Head */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-200 rounded-r-md"></div>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-black text-gray-900 tracking-tighter">{progress}</span>
                      <span className="text-2xl font-bold text-gray-300">%</span>
                    </div>
                    <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Battery Level</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Charging Speed</p>
                      <p className="text-[13px] font-bold text-gray-800">60 kW</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Energy Flow</p>
                      <p className="text-[13px] font-bold text-gray-800">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Battery, label: 'Energy Delivered', value: `${currentKwh} kWh`, sub: 'Live', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { icon: Timer, label: 'Time Elapsed', value: '24 min', sub: 'of 60 min', icon2: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: CreditCard, label: 'Estimated Cost', value: `₹${(currentKwh * 20).toFixed(0)}`, sub: 'Live', color: 'text-purple-500', bg: 'bg-purple-50' },
                { icon: Activity, label: 'Charging Speed', value: '60 kW', sub: 'DC Fast', color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm transition-all hover:scale-[1.02]">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-3 flex items-center gap-1.5">
                    {stat.icon2 && <stat.icon2 size={10} />}
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* TIMELINE */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Session Timeline</h4>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Estimated 5:45 PM</div>
              </div>

              <div className="relative pt-4 pb-8">
                {/* TRACK */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
                {/* NODES */}
                <div className="absolute top-4 left-0 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-md -ml-2"></div>
                <div className={`absolute top-4 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-md transition-all duration-1000`} style={{ left: `${progress}%`, marginLeft: '-8px' }}></div>
                <div className="absolute top-4 right-0 w-4 h-4 bg-gray-200 border-4 border-white rounded-full shadow-md -mr-2"></div>

                <div className="flex justify-between mt-6">
                  <div className="text-left">
                    <p className="text-[11px] font-black text-gray-900 uppercase">Started At</p>
                    <p className="text-[13px] font-bold text-gray-800 mt-1">5:00 PM</p>
                    <p className="text-[10px] text-gray-400 font-medium">May 3, 2026</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black text-gray-900 uppercase">Estimated End</p>
                    <p className="text-[13px] font-bold text-gray-800 mt-1">5:45 PM</p>
                    <p className="text-[10px] text-gray-400 font-medium">May 3, 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Remaining Time</p>
                    <p className="text-xl font-black text-gray-900 mt-1">21 <span className="text-[13px] text-gray-400">min</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* TIP CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { icon: ShieldCheck, title: 'Safe & Secure', desc: 'Your payments are safe and encrypted.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                 { icon: Leaf, title: 'Go Green', desc: 'You\'ve saved 8.6 kg of CO₂ emissions so far.', color: 'text-green-600', bg: 'bg-green-50' },
                 { icon: Info, title: 'Did You Know?', desc: 'Charging at DC fast chargers is 3x faster than AC chargers.', color: 'text-blue-500', bg: 'bg-blue-50' }
               ].map((tip, i) => (
                 <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-start gap-4">
                   <div className={`w-10 h-10 ${tip.bg} ${tip.color} rounded-xl flex items-center justify-center shrink-0`}>
                     <tip.icon size={20} />
                   </div>
                   <div>
                     <h5 className="text-[13px] font-black text-gray-900 mb-1">{tip.title}</h5>
                     <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{tip.desc}</p>
                   </div>
                 </div>
               ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 pt-4">
              <button className="flex-1 bg-[#FF4B60] text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[11px]">
                <Zap size={18} className="fill-current" /> Stop Charging
              </button>
              <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-black py-4 rounded-2xl shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest text-[11px]">
                <FileText size={18} /> View Invoice
              </button>
              <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-black py-4 rounded-2xl shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest text-[11px]">
                <Navigation size={18} /> Navigate to Station
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-8">
            {/* LIVE BILLING */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-[15px] font-black text-gray-900 tracking-tight">Live Billing</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-[13px] text-gray-400 font-medium">Rate</span>
                  <span className="text-[14px] font-black text-gray-900">₹20 / kWh</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-[13px] text-gray-400 font-medium">Energy Used</span>
                  <span className="text-[14px] font-black text-gray-900">{currentKwh} kWh</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <h4 className="text-[16px] font-black text-gray-900">Total Cost</h4>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-500 tracking-tighter">₹{(currentKwh * 20).toFixed(0)}</p>
                  <p className="text-[9px] text-gray-300 font-bold uppercase mt-1">Prices include taxes <Info size={8} className="inline ml-1" /></p>
                </div>
              </div>
            </div>

            {/* STATION DETAILS */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-emerald-500 border border-gray-100">
                  <MapPin size={20} />
                </div>
                <h3 className="text-[15px] font-black text-gray-900 tracking-tight">Station Details</h3>
              </div>

              <div className="space-y-6 pt-2">
                <div>
                  <h4 className="text-[14px] font-black text-gray-900 leading-tight">{booking.stationId?.name}</h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-1 leading-relaxed">
                    {booking.stationId?.address}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { label: 'Charger ID', value: booking.chargerId },
                    { label: 'Connector Type', value: 'CCS2' },
                    { label: 'Power', value: '60 kW DC Fast' },
                  ].map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-[12px] text-gray-400 font-medium">{detail.label}</span>
                      <span className="text-[12px] font-black text-gray-800">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* VEHICLE DETAILS */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500 border border-gray-100">
                  <Car size={20} />
                </div>
                <h3 className="text-[15px] font-black text-gray-900 tracking-tight">Vehicle Details</h3>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Vehicle</span>
                  <span className="text-[12px] font-black text-gray-800">{booking.vehicleDetails?.name || 'Tata Nexon EV'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Battery Capacity</span>
                  <span className="text-[12px] font-black text-gray-800">40 kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Odometer</span>
                  <span className="text-[12px] font-black text-gray-800">12,560 km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChargingProgressPage;
