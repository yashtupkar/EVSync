import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings } from '../api/bookingApi';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Zap, 
  ChevronRight, 
  QrCode, 
  Clock3, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Activity
} from 'lucide-react';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getUserBookings();
        setBookings(response.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'charging': return 'text-amber-500 bg-amber-50 border-amber-100 animate-pulse';
      case 'completed': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'cancelled': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return <Clock3 size={14} />;
      case 'charging': return <Zap size={14} />;
      case 'completed': return <CheckCircle2 size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">My Bookings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No bookings yet</h2>
            <p className="text-gray-500 mt-2">Book your first charging slot now!</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 bg-emerald-500 text-white font-bold px-8 py-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-green-100"
            >
              Discover Stations
            </button>
          </div>
        ) : (
          bookings.map((booking) => (
            <div 
              key={booking._id}
              onClick={() => navigate(`/booking-success/${booking._id}`)}
              className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-1 gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                    <Zap size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate text-sm md:text-base">{booking.stationId?.name}</h3>
                    <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                      <MapPin size={10} />
                      <p className="text-[10px] md:text-[11px] font-medium truncate">{booking.stationId?.address}</p>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full border text-[9px] md:text-[11px] font-bold uppercase tracking-wider shrink-0 ${getStatusColor(booking.bookingStatus)}`}>
                  {getStatusIcon(booking.bookingStatus)}
                  {booking.bookingStatus}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                  <p className="text-[13px] font-bold text-gray-800">{booking.date} • {booking.startTime}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Charger</p>
                  <p className="text-[13px] font-bold text-gray-800">{booking.chargerId}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm shrink-0">
                    <QRCodeCanvas value={`${window.location.origin}/verify-booking/${booking._id}`} size={28} />
                  </div>

                  <div className="px-2.5 py-1.5 bg-gray-900 text-white rounded-xl flex items-center gap-2 shrink-0">
                    <QrCode size={12} className="text-emerald-400" />
                    <span className="text-xs font-black tracking-widest">{booking.otp}</span>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Verification OTP</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-gray-50">
                  {booking.bookingStatus === 'charging' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/charging-progress/${booking._id}`);
                      }}
                      className="px-3 md:px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all shrink-0"
                    >
                      <Activity size={14} /> Track
                    </button>
                  )}
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs md:text-sm whitespace-nowrap">
                    Details <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
