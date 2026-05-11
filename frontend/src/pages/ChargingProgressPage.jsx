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
  CheckCheck,
  ArrowDownToLine,
  Eye,
  Award,
  Activity as ActivityIcon,
  Gauge,
  Map as MapIcon,
  Timer as TimerIcon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Receipt,
  MoreHorizontal
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';





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
  const [powerKw, setPowerKw] = useState(60); // Default for UI
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [currentCost, setCurrentCost] = useState(0);




  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [telemetryLog, setTelemetryLog] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);


  
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
          setElapsedTime(b.elapsedTime || '00:00:00');
          setCurrentCost(b.totalBill || 0);
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
      console.log('🔌 Socket Update Received:', data);
      if (String(data.bookingId) === String(bookingId)) {

        if (data.percentage !== undefined) setProgress(data.percentage);
        if (data.currentKwh !== undefined) {
          setCurrentKwh(data.currentKwh);
          // Add to chart data
          setChartData(prev => [...prev, {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            kwh: data.currentKwh
          }].slice(-20)); // Keep last 20 points
        }

        setStatus(data.status);
        if (data.status === 'completed') {
          setMessage('Charging completed successfully!');
        } else if (data.status === 'charging') {
          setMessage('Your vehicle is charging. Monitor your session in real-time.');
          if (data.minsRemaining) setRemainingTime(`${data.minsRemaining} min`);
          if (data.powerKw) setPowerKw(data.powerKw);
          if (data.elapsedTime) setElapsedTime(data.elapsedTime);
          if (data.currentCostINR !== undefined) setCurrentCost(data.currentCostINR);
        } else if (data.status === 'billing_pending') {

          setMessage('Charging stopped. Waiting for bill generation...');
        }

        // Add to telemetry log
        setTelemetryLog(prev => [{
            timestamp: new Date().toLocaleTimeString(),
            percentage: data.percentage !== undefined ? data.percentage : progress,
            currentKwh: data.currentKwh !== undefined ? data.currentKwh : currentKwh,
            powerKw: data.powerKw || powerKw || 60
        }, ...prev].slice(0, 5));
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
    <div className=" bg-[#F8FAF9] flex flex-col font-sans text-gray-900">
   

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {(status === 'billing_pending' || status === 'completed') ? (
            /* --- SESSION SUMMARY VIEW (POST-CHARGING) --- */
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              
              {/* LEFT COLUMN */}
              <div className="space-y-3">
                {/* HERO CARD */}
                <div className="bg-white rounded-3xl border-2 border-emerald-500/10 shadow-sm overflow-hidden flex items-center  p-6 gap-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100 relative">
                    <CheckCheck size={32} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Session Completed</h2>
                    <p className="text-gray-400 font-bold text-sm">Thank you for charging with EVSync!</p>
                  </div>
                </div>


                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Time', value: elapsedTime, sub: 'HH:MM:SS', icon: Clock, color: 'blue' },
                    { label: 'Energy', value: `${(bill?.unitsConsumed || currentKwh).toFixed(2)}`, sub: 'kWh', icon: Zap, color: 'emerald' },
                    { label: 'Speed', value: `${powerKw}`, sub: 'kW', icon: Gauge, color: 'amber' },
                    { label: 'Cost', value: `₹${(bill?.totalBill || currentCost).toFixed(0)}`, sub: '', icon: IndianRupee, color: 'purple' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center space-y-2 shadow-sm">
                      <div className={`w-10 h-10 bg-${item.color}-50 text-${item.color}-500 rounded-xl flex items-center justify-center`}>
                        <item.icon size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">{item.value}</p>
                        {item.sub && <p className="text-[8px] font-bold text-gray-300 uppercase">{item.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>


                <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6 shadow-sm">
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Payment</h3>
                  
                  <div className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all ${bill?.paymentStatus === 'paid' ? 'border-emerald-100 bg-emerald-50/30' : 'border-amber-100 bg-amber-50/30'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${bill?.paymentStatus === 'paid' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-amber-500 shadow-amber-100'}`}>
                        {bill?.paymentStatus === 'paid' ? <CheckCircle2 size={24} /> : <CreditCard size={24} />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-lg font-black text-gray-900 tracking-tight">{bill?.paymentStatus === 'paid' ? 'Successful' : 'Pending'}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {booking.billTransactionId || 'T-823901'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{(bill?.totalBill || currentCost).toFixed(0)}</p>
                    </div>
                  </div>


                  {bill?.paymentStatus === 'paid' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button className="py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer">
                        <ArrowDownToLine size={20} /> Download Invoice
                      </button>
                      <button className="py-5 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer">
                        <Eye size={20} /> View Receipt
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handlePayBill} 
                      disabled={isPaying} 
                      className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      {isPaying ? <RefreshCcw className="animate-spin" size={20} /> : <><CreditCard size={20} /> Pay Now via Razorpay</>}
                    </button>
                  )}

                  <div className="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                        <Star className="fill-emerald-500" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 tracking-tight">We hope you had a great experience!</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rate your charging experience</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={24} className={star <= 4 ? "text-emerald-400 fill-emerald-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>


              {/* BOTTOM ACTIONS BAR */}
              <div className="lg:col-span-2 grid grid-cols-3 gap-8 pt-4">
                {[
                  { label: 'Need Help?', sub: 'Contact support for any queries', icon: Headphones, color: 'emerald' },
                  { label: 'Find Nearby Stations', sub: 'Locate charging stations near you', icon: MapIcon, color: 'blue' },
                  { label: 'Loyalty Points Earned', sub: `You earned ${Math.floor(currentKwh)} points`, icon: Award, color: 'amber', extra: `${Math.floor(currentKwh)} pts` }
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-500 rounded-2xl flex items-center justify-center shadow-sm`}>
                        <item.icon size={28} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900 tracking-tight group-hover:translate-x-1 transition-transform">{item.label}</p>
                        <p className="text-xs font-bold text-gray-400 tracking-tight">{item.sub}</p>
                      </div>
                    </div>
                    {item.extra ? (
                      <div className={`px-4 py-2 bg-${item.color}-50 text-${item.color}-600 rounded-full text-sm font-black tracking-tight`}>
                        {item.extra}
                      </div>
                    ) : (
                      <ChevronRight size={24} className="text-gray-300" />
                    )}
                  </div>
                ))}
              </div>

            </div>
          ) : (
            /* --- ACTIVE CHARGING VIEW --- */
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3">
              <div className="space-y-4 pb-32">
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

                    <div className="flex-1 w-full space-y-6">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Battery Level</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-6xl font-black text-gray-900 tracking-tighter">{progress}</span>
                          <span className="text-2xl font-bold text-gray-300">%</span>
                        </div>
                      </div>

                      {/* BATTERY VISUAL */}
                      <div className="relative h-16 w-full bg-white border-4 border-gray-100 rounded-xl p-1 flex items-center overflow-hidden">
                        <div 
                          className="h-full rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-in-out relative flex items-center justify-center shadow-lg shadow-emerald-100" 
                          style={{ width: `${progress}%` }}
                        >
                          <Zap size={20} className="text-white fill-white animate-pulse" />
                        </div>
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-7 bg-gray-100 rounded-r-lg"></div>
                      </div>

                      <div className="flex justify-center items-center gap-3">
                        <Zap size={16} className="text-emerald-500" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Speed</p>
                        <span className="text-sm font-black text-gray-900">{powerKw} kW</span>
                      </div>
                    </div>

                  </div>

                  {/* PREMIUM STATS GRID */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm mt-12 overflow-hidden">
                    <div className="grid grid-cols-4 divide-x divide-gray-50">
                      {/* ENERGY */}
                      <div className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                          <Battery size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Energy Delivered</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">{parseFloat(currentKwh).toFixed(4)} kWh</p>
                          <p className="text-[10px] font-bold text-emerald-500">+{((currentKwh / (parseFloat(elapsedTime.split(':')[1]) || 1)) * 60).toFixed(2)} kWh since last hour</p>
                        </div>
                      </div>

                      {/* TIME */}
                      <div className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                          <Clock size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Charging Time</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">{elapsedTime}</p>
                          <p className="text-[10px] font-bold text-gray-400">Started at {booking.startTime}</p>
                        </div>
                      </div>

                      {/* COST */}
                      <div className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 shadow-inner">
                          <IndianRupee size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Charging Cost</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">₹{parseFloat(currentCost).toFixed(1)}</p>
                          <p className="text-[10px] font-bold text-gray-400">₹{booking.ratePerKwh || 8.00} / kWh</p>
                        </div>
                      </div>

                      {/* REMAINING */}
                      <div className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                          <Timer size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Remaining</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">{remainingTime}</p>
                          <p className="text-[10px] font-bold text-gray-400">Est. 100% by {booking.endTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FEATURE HIGHLIGHTS */}
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm mt-6 overflow-hidden">
                    <div className="grid grid-cols-4 divide-x divide-gray-50">
                      {[
                        { title: 'Secure Connection', desc: 'Your session is safe and encrypted', icon: ShieldCheck, color: 'emerald' },
                        { title: 'Vehicle Protected', desc: 'Overcurrent & overheating protection enabled', icon: Car, color: 'blue' },
                        { title: 'Smart Charging', desc: 'Optimizing power for better efficiency', icon: Gauge, color: 'purple' },
                        { title: 'Live Monitoring', desc: "We'll notify you of any important updates", icon: Bell, color: 'amber' }
                      ].map((item, i) => (
                        <div key={i} className="p-6 flex items-center gap-4">
                          <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-500 rounded-2xl flex items-center justify-center shrink-0`}>
                            <item.icon size={20} />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-[11px] font-black text-gray-900 leading-none">{item.title}</h4>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

         

                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Charger</p>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">{booking.chargerId}</h3>
                    </div>
                    <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                      {booking.chargerId.includes('DC') ? 'DC Fast' : 'AC Fast'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Location', value: booking.stationId?.name, icon: MapPin },
                      { label: 'Started', value: booking.startTime, icon: Calendar },
                      { label: 'Remaining', value: remainingTime, icon: Timer, color: 'emerald' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                          <item.icon size={14} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                          <p className={`text-xs font-black ${item.color ? `text-${item.color}-500` : 'text-gray-900'} leading-none`}>{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                              <button 
            onClick={handleStopCharging}
            disabled={status !== 'charging'}
            className="w-full md:w-auto px-12 py-5 mt-4 bg-[#EF4444] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-100 transition-all hover:bg-red-600 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
             Stop Charging
          </button>
                </div>


                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Telemetry</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Live</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                    {telemetryLog.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic text-center py-2">Waiting...</p>
                    ) : (
                      telemetryLog.map((log, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                          <span className="text-[9px] font-mono text-gray-400">{log.timestamp}</span>
                          <div className="flex gap-2">
                            <span className="text-[9px] font-bold text-gray-900">{log.percentage}%</span>
                            <span className="text-[9px] font-bold text-emerald-600">{log.currentKwh}kWh</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>


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
          )}
        </div>
      </main>


     

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
                <div className="space-y-3">
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
