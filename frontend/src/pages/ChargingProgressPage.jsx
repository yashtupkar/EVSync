import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { socket } from '../utils/socket';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  Car,
  RefreshCcw,
  ZapOff,
  Star,
  MessageSquare,
  X,
  IndianRupee,
  CheckCheck
} from 'lucide-react';


const ChargingProgressPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentKwh, setCurrentKwh] = useState(0);
  const [status, setStatus] = useState('initializing');
  const [message, setMessage] = useState('Your vehicle is charging. Monitor your session in real-time.');
  const [bill, setBill] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [remainingTime, setRemainingTime] = useState('Calculating...');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
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
          if (b.statusMessage) setMessage(b.statusMessage);
          
          if (b.bookingStatus === 'billing_pending' || b.bookingStatus === 'completed') {
            setBill({
              unitsConsumed: b.unitsConsumed,
              totalBill: b.totalBill,
              paymentStatus: b.billPaymentStatus,
              order: res.data.billOrder // Include the order details from backend
            });
          }
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();

    const handleUpdate = (data) => {
      if (String(data.bookingId) === String(bookingId)) {
        if (data.percentage !== undefined) setProgress(data.percentage);
        if (data.currentKwh !== undefined) setCurrentKwh(data.currentKwh);
        setStatus(data.status);
        if (data.status === 'completed') {
          setMessage('Charging completed successfully!');
        } else if (data.status === 'charging') {
          setMessage('Your vehicle is charging. Monitor your session in real-time.');
        } else if (data.status === 'billing_pending') {
          setMessage('Charging stopped. Waiting for bill generation...');
        }
      }
    };

    const handleBillGenerated = (data) => {
      if (String(data.bookingId) === String(bookingId)) {
        setBill({
          unitsConsumed: data.unitsConsumed,
          totalBill: data.totalBill,
          order: data.order,
          paymentStatus: 'unpaid'
        });
        setStatus('billing_pending');
        setMessage('Bill generated. Please complete the payment.');
      }
    };

    socket.on('charging_update', handleUpdate);
    socket.on('bill_generated', handleBillGenerated);
    socket.on('bill_paid', () => {
      setStatus('completed');
      setMessage('Payment successful! Charging session closed.');
      if (bill) setBill(prev => ({ ...prev, paymentStatus: 'paid' }));
      // Automatically show review modal after payment success
      setTimeout(() => setShowReviewModal(true), 1500);
    });

    return () => {
      socket.off('charging_update', handleUpdate);
      socket.off('bill_generated', handleBillGenerated);
      socket.off('bill_paid');
    };
  }, [bookingId, token]);

  // Update remaining time
  useEffect(() => {
    if (!booking?.endTime) return;

    const updateRemaining = () => {
      const now = new Date();
      const [time, period] = booking.endTime.split(' ');
      const [hours, minutes] = time.split(':');
      
      const end = new Date();
      let h = parseInt(hours);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      end.setHours(h, parseInt(minutes), 0);

      const diff = end - now;
      if (diff > 0) {
        const mins = Math.floor(diff / 60000);
        setRemainingTime(`${mins} min`);
      } else {
        setRemainingTime('0 min');
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [booking]);

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

  const handlePayBill = async () => {
    if (!bill) return;

    if (!bill.order) {
      toast.error("Payment session expired. Please refresh the page to regenerate.");
      return;
    }

    const resLoad = await loadRazorpay();
    if (!resLoad) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    setIsPaying(true);
    const options = {
      key: bill.order.key,
      amount: bill.order.amount,
      currency: bill.order.currency,
      name: "EVSync Payments",
      description: `Charging Bill for ${booking.stationId.name}`,
      order_id: bill.order.id,
      handler: async (response) => {
        try {
          await axios.post(`${backendURL}/api/bookings/confirm-bill`, {
            bookingId: booking._id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setIsPaying(false);
        } catch (confirmErr) {
          console.error("Bill payment confirmation error:", confirmErr);
          alert("Payment verification failed.");
          setIsPaying(false);
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.mobile
      },
      theme: { color: "#10b981" },
      modal: { ondismiss: () => setIsPaying(false) }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleStopCharging = async () => {
    if (!window.confirm("Are you sure you want to stop charging?")) return;
    
    try {
      const res = await axios.post(`${backendURL}/api/bookings/${bookingId}/stop-charging`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Charging stop request sent");
      }
    } catch (error) {
      console.error("Error stopping charging:", error);
      toast.error("Failed to stop charging");
    }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await axios.post(`${backendURL}/api/stations/${booking.stationId._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        userName: user.name,
        userAvatar: user.avatar,
        userId: user._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success("Review submitted! Thank you.");
        setReviewSubmitted(true);
        setTimeout(() => {
          setShowReviewModal(false);
          navigate('/'); // Go to home page after review
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
          <p className="text-gray-500 mt-2 font-medium">This charging session could not be retrieved.</p>
          <button onClick={() => navigate('/my-bookings')} className="mt-8 w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs">Back to Bookings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans text-gray-900">
   

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          
          {/* LEFT COLUMN: CHARGING STATUS */}
          <div className="space-y-8 pb-32">
            {(status === 'billing_pending' || status === 'completed') ? (
              /* --- SESSION SUMMARY VIEW (POST-CHARGING) --- */
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-emerald-500 p-10 text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight uppercase">Session Completed</h2>
                  <p className="text-emerald-100 font-bold opacity-80 mt-2">ID: {booking._id.slice(-10).toUpperCase()}</p>
                </div>

                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Time</p>
                      <div className="flex items-center justify-center gap-2 text-gray-900">
                        <Clock size={16} className="text-blue-500" />
                        <span className="text-2xl font-black">24 <span className="text-sm text-gray-400">min</span></span>
                      </div>
                    </div>
                    <div className="text-center space-y-2 border-x border-gray-100 px-8">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Energy Added</p>
                      <div className="flex items-center justify-center gap-2 text-gray-900">
                        <Battery size={16} className="text-emerald-500" />
                        <span className="text-2xl font-black">{bill?.unitsConsumed || currentKwh} <span className="text-sm text-gray-400">kWh</span></span>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Cost</p>
                      <div className="flex items-center justify-center gap-2 text-gray-900">
                        <IndianRupee size={16} className="text-purple-500" />
                        <span className="text-2xl font-black">₹{bill?.totalBill || (currentKwh * 20).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-gray-50 w-full"></div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payment Information</h3>
                    {bill ? (
                      <div className={`p-8 rounded-3xl border-2 transition-all ${bill.paymentStatus === 'paid' ? 'border-emerald-100 bg-emerald-50/30' : 'border-amber-100 bg-amber-50/30'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bill.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                              {bill.paymentStatus === 'paid' ? <CheckCircle2 size={24} /> : <CreditCard size={24} />}
                            </div>
                            <div>
                              <p className="text-lg font-black text-gray-900">{bill.paymentStatus === 'paid' ? 'Paid Successfully' : 'Payment Pending'}</p>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Transaction ID: {booking.billTransactionId || 'T-823901'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{bill.totalBill}</span>
                          </div>
                        </div>

                        {bill.paymentStatus !== 'paid' && (
                          <button 
                            onClick={handlePayBill} 
                            disabled={isPaying} 
                            className="w-full mt-8 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                          >
                            {isPaying ? <RefreshCcw className="animate-spin" size={20} /> : <><CreditCard size={20} /> Pay Now via Razorpay</>}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50 rounded-3xl text-center border border-dashed border-slate-200">
                        <RefreshCcw size={32} className="text-slate-300 mx-auto mb-4 animate-spin" />
                        <p className="text-slate-500 font-bold">Waiting for operator to generate final bill...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* --- ACTIVE CHARGING VIEW --- */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden py-8 pr-8">
                <div className="flex justify-between items-center mb-10 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Charging in Progress</h2>
                      <p className="text-sm text-gray-400 font-medium">{message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Active
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12 relative">
                  <div className="flex-1 w-full max-w-[390px] relative">
                    <img src="/assets/ev-images/charging-progress.png" alt="Car" className="w-full h-auto object-contain z-10 relative" />
                    <div className="absolute inset-0 bg-emerald-100/20 blur-[60px] rounded-full scale-75 -z-0"></div>
                  </div>

                  <div className="flex-1 w-full space-y-10">
                    <div className="text-center">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Battery Level</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-7xl font-black text-gray-900 tracking-tighter">{progress}</span>
                        <span className="text-3xl font-bold text-gray-300">%</span>
                      </div>
                    </div>

                    {/* BATTERY VISUAL */}
                    <div className="relative h-20 w-full bg-white border-4 border-gray-100 rounded-xl p-1.5 flex items-center overflow-hidden">
                      <div 
                        className="h-full rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-in-out relative flex items-center justify-center shadow-lg shadow-emerald-100" 
                        style={{ width: `${progress}%` }}
                      >
                        <Zap size={24} className="text-white fill-white animate-pulse" />
                      </div>
                      {/* Battery Head */}
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-8 bg-gray-100 rounded-r-lg"></div>
                    </div>

                    <div className="flex justify-center items-center gap-3">
                      <Zap size={16} className="text-emerald-500" />
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Charging Speed</p>
                      <span className="text-base font-black text-gray-900">60 kW</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM METRICS */}
                <div className="mt-16 pt-8 pl-8 border-t border-gray-50 grid grid-cols-3 gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Battery size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Energy Delivered</p>
                      <p className="text-xl font-black text-gray-900 tracking-tight">{currentKwh} kWh</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-l border-gray-50 pl-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Elapsed</p>
                      <p className="text-xl font-black text-gray-900 tracking-tight">24 min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-l border-gray-50 pl-8">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 font-bold text-xl">
                      ₹
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Cost</p>
                      <p className="text-xl font-black text-gray-900 tracking-tight">₹{(currentKwh * 20).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: CHARGER DETAILS */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Charger</p>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{booking.chargerId}</h3>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  DC Fast
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight">{booking.stationId?.name}</h4>
                    <p className="text-[11px] text-gray-400 font-medium mt-1 leading-relaxed">{booking.stationId?.address}</p>
                  </div>
                </div>

                <div className="h-[1px] bg-gray-50 w-full"></div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Session Started</p>
                    <h4 className="text-sm font-black text-gray-900 mt-0.5">{booking.date} • {booking.startTime}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimated End</p>
                    <h4 className="text-sm font-black text-gray-900 mt-0.5">{booking.date} • {booking.endTime}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
                    <Timer size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remaining Time</p>
                    <h4 className="text-2xl font-black text-emerald-500 mt-0.5 tracking-tight">{remainingTime}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* SECURE TIP */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100">
                 <ShieldCheck size={20} />
               </div>
               <div>
                 <h5 className="text-[13px] font-black text-gray-900 leading-none">Secure & Monitored</h5>
                 <p className="text-[10px] text-gray-400 font-medium mt-1.5 leading-relaxed">Your charging session is secure and actively monitored.</p>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER ACTION BAR */}
      <footer className="bg-white border-t border-gray-100 p-6 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="text-[13px] font-black text-gray-900 leading-none">Secure & Monitored</h5>
              <p className="text-[10px] text-gray-400 font-medium mt-1.5 leading-relaxed">Your charging session is secure and actively monitored.</p>
            </div>
          </div>

          <button 
            onClick={handleStopCharging}
            disabled={status !== 'charging'}
            className="w-full md:w-auto px-12 py-5 bg-[#EF4444] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-100 transition-all hover:bg-red-600 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            <ZapOff size={20} /> Stop Charging
          </button>
        </div>
      </footer>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-xl p-8 shadow-2xl relative z-10 border border-slate-100"
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className="absolute right-6 top-6 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-2">
                  <Star size={32} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rate Your Experience</h3>
                <p className="text-slate-400 font-medium text-sm">How was your charging session at {booking.stationId.name}?</p>
              </div>

              {reviewSubmitted ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCheck size={40} />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">Thank you!</h4>
                  <p className="text-slate-400 font-medium">Your feedback helps us improve.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`transition-all hover:scale-110 ${reviewRating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        <Star size={40} fill={reviewRating >= star ? "currentColor" : "none"} strokeWidth={2.5} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Your Comments</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell us about the charger quality, station amenities, or any issues you faced..."
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white transition-all outline-none min-h-[120px] resize-none"
                    />
                  </div>

                  <button
                    onClick={submitReview}
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmittingReview ? <RefreshCcw className="animate-spin" size={20} /> : <><MessageSquare size={18} /> Submit Review</>}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChargingProgressPage;
