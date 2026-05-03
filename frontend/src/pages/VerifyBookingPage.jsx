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
  ShieldCheck
} from 'lucide-react';

const VerifyBookingPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
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
    try {
      setVerifying(true);
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${backendURL}/api/bookings/${bookingId}/status`, {
        status: 'completed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Session Started Successfully!");
        setBooking(response.data.booking);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to start session");
    } finally {
      setVerifying(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Invalid Booking</h2>
          <p className="text-gray-500 mt-2 text-sm">This QR code is invalid or the booking has expired.</p>
          <button onClick={() => navigate('/')} className="mt-6 w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-6 font-sans">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">Operator Verification</h1>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Header Status */}
          <div className={`p-6 text-center ${booking.bookingStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
              {booking.bookingStatus === 'completed' ? <CheckCircle2 size={32} /> : <Clock size={32} />}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {booking.bookingStatus === 'completed' ? 'Booking Verified' : 'Awaiting Arrival'}
            </h2>
            <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">
              ID: {booking._id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Customer Section */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                <User size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                <h3 className="text-lg font-bold text-gray-900">{booking.userId?.name || 'Customer'}</h3>
              </div>
            </div>

            {/* Vehicle Section */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                <Car size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle Details</p>
                <h3 className="text-lg font-bold text-gray-900">{booking.vehicleDetails?.name || 'Electric Vehicle'}</h3>
              </div>
            </div>

            {/* Charger Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Charger</p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <Zap size={16} fill="currentColor" />
                  <span className="font-black text-lg">{booking.chargerId}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">OTP CODE</p>
                <span className="font-black text-2xl text-gray-900 tracking-widest">{booking.otp}</span>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                Verify the OTP code with the customer before starting the charging session.
              </p>
            </div>

            {/* Actions */}
            {booking.bookingStatus !== 'completed' ? (
              <button 
                onClick={handleStartCharging}
                disabled={verifying}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {verifying ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Start Charging Session
                  </>
                )}
              </button>
            ) : (
              <div className="w-full bg-gray-100 text-gray-400 font-black py-5 rounded-[1.5rem] text-center">
                Session Completed
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-[10px] mt-8 font-bold uppercase tracking-[0.2em]">
          Powered by EVSync Admin Portal
        </p>
      </div>
    </div>
  );
};

export default VerifyBookingPage;
