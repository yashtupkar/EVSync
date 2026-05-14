import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Zap, 
  ArrowRight, 
  Download, 
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Navigation,
  Activity,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { socket } from '../utils/socket';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';


const BookingSuccessPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [batteryConfig, setBatteryConfig] = useState({ current: 20, target: 80 });
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);



  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('token');
        const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const response = await axios.get(`${backendURL}/api/bookings/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const currentBooking = response.data.find(b => b._id === bookingId);
        setBooking(currentBooking);
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();

    // Listen for real-time status update to redirect to progress page
    const handleChargingStart = (data) => {
      if (String(data.bookingId) === String(bookingId) && data.status === 'charging') {
        navigate(`/charging-progress/${bookingId}`);
      }
    };

    socket.on('charging_update', handleChargingStart);
    return () => socket.off('charging_update', handleChargingStart);
  }, [bookingId, navigate]);

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(booking?.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartChargingMqtt = async () => {
    try {
      setIsStarting(true);
      const token = localStorage.getItem('token');
      const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      
      const response = await axios.post(`${backendURL}/api/bookings/${bookingId}/start-mqtt`, {
        currentPercent: batteryConfig.current,
        targetPercent: batteryConfig.target
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Charging initiated via MQTT!");
        navigate(`/charging-progress/${bookingId}`);
      }
    } catch (error) {
      console.error("Error starting MQTT charging:", error);
      toast.error(error.response?.data?.message || "Failed to start charging");
    } finally {
      setIsStarting(false);
      setShowSetupModal(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? Note: Excessive cancellations may lead to an automatic account ban.')) {
      return;
    }

    try {
      setIsCancelling(true);
      const token = localStorage.getItem('token');
      const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      
      const response = await axios.patch(`${backendURL}/api/bookings/${bookingId}/status`, {
        status: 'cancelled'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Booking cancelled successfully");
        setBooking(prev => ({ ...prev, bookingStatus: 'cancelled' }));
        setTimeout(() => navigate('/discovery'), 1500);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Booking not found</h2>
          <button onClick={() => navigate('/discovery')} className="mt-4 text-emerald-500 font-bold">Go to Discovery</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8FAF9] py-8 md:py-12 px-4 sm:px-6 lg:px-8 font-sans pb-24 md:pb-12">

      <div className="max-w-2xl mx-auto">
        {/* Success Animation Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20"></div>
            <CheckCircle2 size={40} className="text-emerald-500 relative z-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-sm md:text-base text-gray-500 mt-2 font-medium px-4">Your charging slot has been successfully reserved.</p>
        </div>

        {/* OTP Card - Rapido Style */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8">
          <div className="bg-emerald-500 p-6 md:p-8 text-center text-white flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
            <div className="bg-white p-2.5 md:p-3 rounded-2xl shadow-lg shrink-0">
              <QRCodeCanvas 
                value={`${window.location.origin}/verify-booking/${bookingId}`} 
                size={window.innerWidth < 768 ? 120 : 150}

                level={"H"}
                includeMargin={false}
                imageSettings={{
                  src: "/assets/logo-small.png",
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            <div className="text-center md:text-left flex flex-col items-center md:items-start gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">QR VERIFICATION</p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <span className="text-2xl font-black tracking-tight uppercase">Ready to Charge</span>
                </div>
              </div>

              {/* Hidden OTP Section */}
              <div className="flex flex-col items-center md:items-start gap-3">
                {showOTP ? (
                  <div className="flex items-center gap-3 md:gap-4 bg-white/10 px-3 md:px-4 py-2 rounded-2xl backdrop-blur-md border border-white/20 animate-in fade-in zoom-in duration-300">
                    <span className="text-2xl md:text-4xl font-black tracking-[0.2em] md:tracking-[0.3em] text-white">{booking.otp}</span>
                    <button 
                      onClick={handleCopyOTP}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                      title="Copy OTP"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                    <button 
                      onClick={() => setShowOTP(false)}
                      className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:text-white transition-colors"
                    >
                      Hide
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowOTP(true)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 md:px-4 py-2 rounded-xl border border-white/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest text-white group"
                  >
                    <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                    Show OTP Code
                  </button>
                )}
              </div>

              <p className="text-[11px] font-bold bg-white/20 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm">
                Scan this QR at the station to start
              </p>
            </div>
          </div>


          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Station Information</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-gray-100">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{booking.stationId.name}</h4>
                      <div className="flex items-start gap-1 mt-1">
                        <MapPin size={12} className="text-gray-400 mt-0.5" />
                        <p className="text-[11px] text-gray-500 leading-relaxed">{booking.stationId.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Date</h3>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-[13px] font-bold text-gray-800">{booking.date}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Time</h3>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-[13px] font-bold text-gray-800">{booking.startTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Summary */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Charger ID</span>
                    <span className="font-bold text-gray-900">{booking.chargerId}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Vehicle</span>
                    <span className="font-bold text-gray-900">{booking.vehicleDetails?.name || 'My EV'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-emerald-600">₹{booking.amount}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-[10px] text-gray-400">{booking.transactionId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="mt-0.5 text-amber-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-amber-800">Start Charging on Time!</h4>
                <p className="text-[12px] text-amber-700 mt-1 font-medium leading-relaxed">
                  Please ensure your charging session begins within <strong className="font-black">10 minutes</strong> of your scheduled start time. Otherwise, your slot will be automatically released and the booking will be cancelled.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 space-y-4">
              {booking.bookingStatus === 'charging' && (
                <button 
                  onClick={() => navigate(`/charging-progress/${bookingId}`)}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all animate-pulse"
                >
                  <Activity size={20} />
                  Track Live Progress
                </button>
              )}

              {booking.stationId.stationType === 'unmanned' && booking.bookingStatus === 'upcoming' && (
                <button 
                  onClick={() => setShowSetupModal(true)}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all"
                >
                  <Zap size={20} />
                  Start Charging Now (Unmanned)
                </button>
              )}


              {localStorage.getItem("evsync_trip_in_progress") === "true" && (
                <button 
                  onClick={() => {
                    localStorage.removeItem("evsync_trip_in_progress");
                    navigate(`/trip-planner?nextStopId=${booking.stationId._id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 md:py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all"
                >
                  <Navigation size={20} />
                  Continue Trip Planner
                </button>
              )}

              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {booking.bookingStatus === 'upcoming' && (
                <button 
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-all border border-red-100"
                >
                  {isCancelling ? (
                    <RefreshCcw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle size={18} />
                      Cancel Booking
                    </>
                  )}
                </button>
              )}
                <button 
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-2xl transition-all"
                >
                  Back to Discovery
                  <ArrowRight size={18} />
                </button>
              </div>

            
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-gray-400 pb-8 md:pb-0">
          <button className="flex items-center gap-2 text-xs font-bold hover:text-gray-600 transition-colors">
            <Download size={14} /> Download Receipt
          </button>
          <button className="flex items-center gap-2 text-xs font-bold hover:text-gray-600 transition-colors">
            <Share2 size={14} /> Share Details
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
            <ShieldCheck size={14} /> Secure Booking
          </div>
        </div>
      </div>
    </div>

    {/* SETUP MODAL */}
    <AnimatePresence>
        {showSetupModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSetupModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              className="bg-white w-full max-w-md  rounded-t-[2.5rem] md:rounded-3xl p-6 pb-24 md:pb-8 shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-2">
                  <Zap size={32} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Charging Setup</h3>
                <p className="text-slate-400 font-medium text-sm">Configure your battery targets for this session.</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Battery Level</label>
                    <span className="text-sm font-black text-emerald-600">{batteryConfig.current}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={batteryConfig.current}
                    onChange={(e) => setBatteryConfig({...batteryConfig, current: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Battery Level</label>
                    <span className="text-sm font-black text-emerald-600">{batteryConfig.target}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={batteryConfig.target}
                    onChange={(e) => setBatteryConfig({...batteryConfig, target: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <Activity size={20} className="text-emerald-500" />
                    <p className="text-[11px] font-bold text-emerald-800">
                        Estimated charge: {Math.max(0, batteryConfig.target - batteryConfig.current)}% increase
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowSetupModal(false)}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartChargingMqtt}
                        disabled={isStarting}
                        className="flex-2 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 px-8"
                    >
                        {isStarting ? <RefreshCcw className="animate-spin" size={16} /> : <><Zap size={16} /> Start Session</>}
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BookingSuccessPage;

