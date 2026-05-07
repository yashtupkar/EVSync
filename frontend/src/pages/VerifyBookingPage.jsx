import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  User, 
  Car,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  RefreshCcw,
  CheckCheck,
  ZapOff,
  Phone,
  Calendar,
  CreditCard,
  Battery,
  Timer
} from 'lucide-react';

const VerifyBookingPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [otp, setOtp] = useState('');
  const [unitsConsumed, setUnitsConsumed] = useState('');
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backendURL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setBooking(response.data.booking);
        } else {
          setBooking(null);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchBookingDetails();
  }, [bookingId, backendURL]);


  const handleStartCharging = async () => {
    if (!otp || otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
      return;
    }

    try {
      setVerifying(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${backendURL}/api/bookings/${bookingId}/start-charging`, { otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Charging Session Started!");
        // Refresh booking details
        const refreshRes = await axios.get(`${backendURL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.data.success) {
          setBooking(refreshRes.data.booking);
        }
      }
    } catch (error) {
      console.error("Error starting charging:", error);
      toast.error("Failed to start session");
    } finally {
      setVerifying(false);
    }
  };

  const handleStopCharging = async () => {
    try {
      setStopping(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${backendURL}/api/bookings/${bookingId}/stop-charging`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Charging stopped");
        setShowBillForm(true);
        // Refresh booking details
        const refreshRes = await axios.get(`${backendURL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.data.success) {
          setBooking(refreshRes.data.booking);
        }
      }
    } catch (error) {
      console.error("Error stopping charging:", error);
      toast.error("Failed to stop charging");
    } finally {
      setStopping(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!unitsConsumed || isNaN(unitsConsumed)) {
      toast.error("Please enter valid units");
      return;
    }

    try {
      setIsGeneratingBill(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${backendURL}/api/bookings/${bookingId}/generate-bill`, 
        { unitsConsumed: parseFloat(unitsConsumed) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Bill generated and sent to user");
        setShowBillForm(false);
        // Refresh booking details
        const refreshRes = await axios.get(`${backendURL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.data.success) {
          setBooking(refreshRes.data.booking);
        }
      }
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Failed to generate bill");
    } finally {
      setIsGeneratingBill(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Fetching Details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-sm border border-slate-100">
          <XCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Invalid Session</h2>
          <p className="text-slate-400 mt-2 font-medium">This QR code or session link is invalid.</p>
          <button onClick={() => navigate(-1)} className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-[1.02]">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  // Calculate duration string
  const getDuration = () => {
    if (booking.startTime && booking.endTime) {
      return `${booking.startTime} - ${booking.endTime}`;
    }
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Verify Session</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {booking._id.slice(-8)}</p>
            </div>
          </div>
          
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
            booking.bookingStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
            booking.bookingStatus === 'charging' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
            'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            {booking.bookingStatus}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        
        {/* Verification Alert */}
        {booking.bookingStatus === 'upcoming' && (
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Security Check Required</h3>
              <p className="text-xs font-medium text-emerald-700/80 mt-1">Please confirm the customer's identity and vehicle before starting the session.</p>
            </div>
          </div>
        )}

        {/* Main Grid Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Customer & Vehicle Info */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Customer & Vehicle</h4>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                    <h3 className="text-base font-black text-slate-900">{booking.userId?.name || 'Customer'}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                    <h3 className="text-base font-black text-slate-900">{booking.userId?.mobile || 'N/A'}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Car size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</p>
                    <h3 className="text-base font-black text-slate-900">{booking.vehicleDetails?.name || 'Electric Vehicle'}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session & Payment Info */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Session Details</h4>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Charger ID</p>
                    <h3 className="text-base font-black text-slate-900">{booking.chargerId}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Date</p>
                    <h3 className="text-base font-black text-slate-900">{booking.date}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Timer size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                    <h3 className="text-base font-black text-slate-900">{getDuration()}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <CreditCard size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900 capitalize">{booking.paymentStatus}</h3>
                      <span className="text-sm font-black text-emerald-600">₹{booking.amount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charger Info */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Charger</p>
            <div className="flex items-center gap-2 text-emerald-600">
              <Zap size={16} fill="currentColor" />
              <span className="font-black text-lg">{booking.chargerId}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <span className="font-black text-sm text-slate-900 uppercase tracking-widest">{booking.paymentStatus}</span>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
            Enter the 4-digit OTP provided by the customer to start the session.
          </p>
        </div>

        {/* OTP Input Section */}
        {booking.bookingStatus === 'upcoming' && (
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 space-y-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Enter Customer OTP</p>
            <div className="flex justify-center gap-2">
              <input
                type="text"
                maxLength="4"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0000"
                className="w-full text-center bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 text-3xl font-black tracking-[0.5em] text-emerald-600 focus:border-emerald-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        )}

        {/* Dynamic Action Section */}
        <div className="pt-2 pb-12">
          {booking.bookingStatus === 'upcoming' ? (
            <button 
              onClick={handleStartCharging}
              disabled={verifying || otp.length !== 4}
              className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {verifying ? <RefreshCcw className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Verify & Start Session</>}
            </button>
          ) : booking.bookingStatus === 'charging' ? (
            <button 
              onClick={handleStopCharging}
              disabled={stopping}
              className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {stopping ? <RefreshCcw className="animate-spin" size={20} /> : <><ZapOff size={20} /> Stop Charging Session</>}
            </button>
          ) : (booking.bookingStatus === 'billing_pending' || showBillForm) ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCheck size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Generate Final Bill</h3>
                <p className="text-slate-400 font-medium text-sm">Session ended successfully. Enter units consumed to complete.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Energy Units Consumed</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={unitsConsumed}
                    onChange={(e) => setUnitsConsumed(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-5 text-2xl font-black text-slate-900 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg uppercase">kWh</div>
                </div>
              </div>

              <button
                onClick={handleGenerateBill}
                disabled={isGeneratingBill || !unitsConsumed}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isGeneratingBill ? <RefreshCcw className="animate-spin" size={20} /> : <><CheckCheck size={20} /> Generate & Send Bill</>}
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 font-black py-6 rounded-2xl text-center flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
              <CheckCircle2 size={20} />
              Session Completed & Billed
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-[10px] mt-8 font-bold uppercase tracking-[0.2em]">
          Powered by EVSync Admin Portal
        </p>
      </div>
    </div>
  );
};

export default VerifyBookingPage;

