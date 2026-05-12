import React, { useEffect } from 'react';
import { socket } from '../utils/socket';
import toast from 'react-hot-toast';
import { Bell, Zap, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookingNotificationListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNewBooking = (data) => {
      console.log('🔔 New Booking Notification Received:', data);
      
      // Play a subtle notification sound (optional, but premium)
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn('Audio play failed', e));
      } catch (e) {}

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-[1.5rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-2 border-emerald-500/10`}
          onClick={() => {
            toast.dismiss(t.id);
            navigate('/host-dashboard');
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Zap size={24} fill="currentColor" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-black text-slate-900 tracking-tight">
                  New Booking Received!
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500 leading-tight uppercase tracking-widest">
                  {data.userName} booked {data.stationName}
                </p>
                <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        <Calendar size={10} /> {data.timeSlot}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                        View Details <ArrowRight size={10} />
                    </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-l border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-right'
      });
    };

    socket.on('new_booking_notification', handleNewBooking);

    return () => {
      socket.off('new_booking_notification', handleNewBooking);
    };
  }, [navigate]);

  return null; // This is a logic-only component
};

export default BookingNotificationListener;
