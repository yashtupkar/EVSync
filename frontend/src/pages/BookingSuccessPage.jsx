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
  Navigation
} from 'lucide-react';

const BookingSuccessPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/bookings/my-bookings`, {
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
  }, [bookingId]);

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(booking?.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-[#F8FAF9] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20"></div>
            <CheckCircle2 size={40} className="text-emerald-500 relative z-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-gray-500 mt-2 font-medium">Your charging slot has been successfully reserved.</p>
        </div>

        {/* OTP Card - Rapido Style */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8">
          <div className="bg-emerald-500 p-8 text-center text-white flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <QRCodeCanvas 
                value={`${window.location.origin}/verify-booking/${bookingId}`} 
                size={150}

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

            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Verification Code</p>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-5xl font-black tracking-[0.3em] ml-[0.3em]">{booking.otp}</span>
                <button 
                  onClick={handleCopyOTP}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-[11px] mt-4 font-bold bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                Scan QR or show code to the operator
              </p>
            </div>
          </div>


          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            {/* Action Buttons */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.stationId.location.coordinates[1]},${booking.stationId.location.coordinates[0]}`, '_blank')}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all"
              >
                <Navigation size={18} />
                Get Directions
              </button>
              <button 
                onClick={() => navigate('/discovery')}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-2xl transition-all"
              >
                Back to Discovery
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-6 text-gray-400">
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
  );
};

export default BookingSuccessPage;
