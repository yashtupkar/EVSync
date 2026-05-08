import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectToken } from '../features/auth/authSelectors';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Zap, MapPin, Clock, Activity, Battery,
    AlertCircle, RefreshCcw, QrCode,
    CheckCircle2, Timer, User as UserIcon,
    ArrowUpRight, IndianRupee, ZapOff,
    Wrench, Play, Square, AlertTriangle, HelpCircle,
    LayoutGrid, List,
    ChevronRight,
    EvCharger,
    CheckCheck,
    CheckCheckIcon,
    CheckCircle,
    Check,
    Phone,
    Car,
    MoreVertical
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ChargerCard = ({ charger, updateChargerStatus, onScan, onStopCharging, activeBooking }) => {
    const isAvailable = charger.status === 'available';
    const isBooked = charger.status === 'occupied';
    const isCharging = charger.status === 'in_use';
    const isMaintenance = charger.status === 'maintenance';

    const [showMenu, setShowMenu] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

    // Get dynamic price from database fields
    const price = charger.pricePerUnit || charger.pricePerMinute || charger.price || 15;

    // Calculate progress and time remaining if activeBooking exists
    const [timeLeft, setTimeLeft] = useState(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval;
        if (isCharging && activeBooking) {
            const calculateProgress = () => {
                // Use socket progress if available, otherwise estimate based on time
                if (activeBooking.percentage !== undefined) {
                    setProgress(activeBooking.percentage);
                }

                // Calculate time left from startTime/endTime if it's currently charging
                if (activeBooking.startTime && activeBooking.endTime) {
                    const now = new Date();
                    const [endH, endM] = activeBooking.endTime.split(':');
                    const [endHour, endPeriod] = endH.split(' ');
                    let hours = parseInt(endHour);
                    if (endPeriod === 'PM' && hours !== 12) hours += 12;
                    if (endPeriod === 'AM' && hours === 12) hours = 0;
                    
                    const end = new Date();
                    end.setHours(hours, parseInt(endM), 0);

                    const diff = end - now;
                    if (diff > 0) {
                        const mins = Math.floor(diff / 60000);
                        const secs = Math.floor((diff % 60000) / 1000);
                        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                    } else {
                        setTimeLeft('Ending...');
                    }
                }
            };

            calculateProgress();
            interval = setInterval(calculateProgress, 1000);
        }
        return () => clearInterval(interval);
    }, [isCharging, activeBooking]);

    const handleStatusClick = (status) => {
        setPendingStatus(status);
        setShowConfirm(true);
        setShowMenu(false);
    };

    const confirmStatusChange = () => {
        if (pendingStatus) {
            updateChargerStatus(charger.chargerId, pendingStatus);
        }
        setShowConfirm(false);
        setPendingStatus(null);
    };

    return (
        <div className={`relative shrink-0 rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-300 ${isAvailable
            ? "border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md"
            : isCharging
                ? "border-blue-100 bg-blue-50/40"
                : isBooked
                    ? "border-amber-100 bg-amber-50/40"
                    : "border-red-100 bg-red-50/40"
            }`}>
            {/* Confirmation Popup overlay - Full Screen */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col items-center justify-center p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                        <AlertTriangle size={32} className="text-amber-500 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-2">Confirm Status Change</h3>
                        <p className="text-sm font-medium text-slate-500 mb-6">
                            Are you sure you want to change the status of charger <span className="font-bold text-slate-800">{charger.chargerId}</span> to <span className="font-black text-slate-800 uppercase">{pendingStatus}</span>?
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => { setShowConfirm(false); setPendingStatus(null); }}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmStatusChange}
                                className="flex-1 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAvailable ? "bg-emerald-50 text-emerald-600" :
                    isCharging ? "bg-blue-50 text-blue-500" :
                        isBooked ? "bg-amber-50 text-amber-500" :
                            "bg-red-50 text-red-500"
                    }`}>
                    <EvCharger size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-gray-700 truncate">{charger.chargerId}</p>
                    <p className="text-[9px] text-gray-400 font-medium uppercase truncate">{charger.type} • {charger.power}kW</p>
                </div>
                {isAvailable && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg text-center ${isAvailable ? "bg-emerald-100 text-emerald-700" :
                    isCharging ? "bg-blue-100 text-blue-700" :
                        isBooked ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                    }`}>
                    {isCharging ? 'In Use' : isBooked ? 'Occupied' : charger.status}
                </span>

                {isCharging && activeBooking && (
                    <div className="space-y-2 mt-1">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <Timer size={10} className="text-blue-600" />
                                <span className="text-[10px] font-black text-blue-600">{timeLeft || 'Calculating...'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Battery size={10} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-600">{progress}%</span>
                            </div>
                        </div>
                        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-500" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-black text-gray-400 uppercase tracking-widest">
                            <span>{activeBooking.userId?.name || 'User'}</span>
                            <span>{activeBooking.startTime} - {activeBooking.endTime}</span>
                        </div>
                    </div>
                )}

                {!isAvailable && !isCharging && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                {isMaintenance ? 'Issue' : 'Status'}
                            </p>
                            <p className={`text-[10px] font-black ${isMaintenance ? 'text-red-600' : 'text-gray-700'}`}>
                                {isMaintenance ? 'Connector Fault' : isBooked ? 'Reserved' : 'Ready'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                Price
                            </p>
                            <p className="text-[10px] font-black text-gray-700">
                                ₹{price}/kWh
                            </p>
                        </div>
                    </div>
                )}

                {isAvailable && (
                    <p className="text-[11px] font-bold text-gray-800">₹{price}/kWh</p>
                )}
            </div>

            <div className="pt-2 border-t border-gray-100/50 mt-1">
                {isAvailable && (
                    <div className='flex gap-2 justify-end'>
                        <button
                            onClick={() => onScan(charger.chargerId)}
                            className="p-2 bg-slate-100 text-gray-800 hover:text-gray-600 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Scan Booking QR"
                        >
                            <QrCode size={16} />
                        </button>
                    </div>
                )}
                {isBooked && (
                    <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center px-1">Slot Reserved</p>
                        <button
                            onClick={() => updateChargerStatus(charger.chargerId, 'available')}
                            className="w-full py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-slate-800 transition-all"
                        >
                            Release Slot
                        </button>
                    </div>
                )}
                {isCharging && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Active Session</p>
                            <button
                                onClick={() => updateChargerStatus(charger.chargerId, 'available')}
                                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                            >
                                Force Stop
                            </button>
                        </div>
                        <button
                            onClick={() => onStopCharging(charger.chargerId)}
                            className="w-full py-2 mt-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-red-700 transition-all"
                        >
                            Stop Charging
                        </button>
                    </div>
                )}
                {isMaintenance && (
                    <button
                        disabled
                        className="w-full py-2 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-gray-100 cursor-not-allowed"
                    >
                        In Maintenance
                    </button>
                )}

                {/* 3-Dot Menu at the bottom */}
                <div className="mt-2 flex justify-end">
                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)} 
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
                            title="Change Status"
                        >
                            <MoreVertical size={16} />
                        </button>
                        
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 text-[10px] font-bold uppercase tracking-widest overflow-hidden">
                                    <button onClick={() => handleStatusClick('available')} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-emerald-600 transition-colors">Available</button>
                                    <button onClick={() => handleStatusClick('occupied')} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-amber-600 transition-colors">Occupied</button>
                                    <button onClick={() => handleStatusClick('in_use')} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-blue-600 transition-colors">In Use</button>
                                    <button onClick={() => handleStatusClick('maintenance')} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-red-600 transition-colors">Maintenance</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const OperatorDashboard = () => {
    const user = useSelector(selectUser);
    const token = useSelector(selectToken);

    const [station, setStation] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('live');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [billingBooking, setBillingBooking] = useState(null);
    const [unitsConsumed, setUnitsConsumed] = useState('');
    const [isGeneratingBill, setIsGeneratingBill] = useState(false);
    const navigate = useNavigate();

        const fetchDashboardData = React.useCallback(async () => {
        try {
            setRefreshing(true);
            const stationRes = await axios.get(`${backendURL}/api/stations/operator/my-station`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (stationRes.data.success) {
                const stationData = stationRes.data.station;
                setStation(stationData);

                // Fetch bookings for this station
                const bookingsRes = await axios.get(`${backendURL}/api/bookings/station/${stationData._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (bookingsRes.data.success) {
                    // Sort bookings: Instant bookings first, then by date/time (most recent first)
                    const sortedBookings = [...bookingsRes.data.bookings].sort((a, b) => {
                        // First priority: Instant bookings
                        if (a.isInstant && !b.isInstant) return -1;
                        if (!a.isInstant && b.isInstant) return 1;
                        
                        // Second priority: Active/Charging status
                        const statusPriority = { 'charging': 0, 'upcoming': 1, 'billing_pending': 2, 'completed': 3, 'cancelled': 4 };
                        const priorityA = statusPriority[a.bookingStatus] ?? 5;
                        const priorityB = statusPriority[b.bookingStatus] ?? 5;
                        if (priorityA !== priorityB) return priorityA - priorityB;

                        // Third priority: Most recent creation
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    });
                    setBookings(sortedBookings);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // toast.error("Failed to load station data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, backendURL]);

    useEffect(() => {
        fetchDashboardData();
    }, [token]); // Re-fetch if token changes

    // Socket.io for real-time updates
    useEffect(() => {
        if (!station?._id) return;

        const currentStationId = String(station._id);

        const handleNewBooking = (data) => {
            console.log("New booking event received:", data);
            // Robust ID comparison using String()
            if (data.stationId && String(data.stationId) === currentStationId) {
                toast.success('New booking confirmed!');
                fetchDashboardData();
            }
        };

        const handleStatusUpdate = (data) => {
            console.log("[SOCKET_DEBUG] Status update event received:", data);
            // Strictly filter by stationId to avoid unnecessary global refreshes
            if (data.stationId && String(data.stationId) === currentStationId) {
                console.log("[SOCKET_DEBUG] Station match found. Refreshing dashboard...");
                fetchDashboardData();
            } else {
                console.log("[SOCKET_DEBUG] Station mismatch. Event ignored.", data.stationId, "vs", currentStationId);
            }
        };

        socket.on('booking_confirmed', handleNewBooking);
        socket.on('booking_status_updated', handleStatusUpdate);
        socket.on('charger_status_updated', handleStatusUpdate);

        return () => {
            socket.off('booking_confirmed', handleNewBooking);
            socket.off('booking_status_updated', handleStatusUpdate);
            socket.off('charger_status_updated', handleStatusUpdate);
        };
    }, [station?._id, fetchDashboardData]); // Re-bind if station ID or fetch function changes



    const updateChargerStatus = async (chargerId, newStatus) => {
        try {
            const response = await axios.patch(`${backendURL}/api/stations/${station._id}/chargers/${chargerId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(`Charger ${chargerId} is now ${newStatus}`);
                setStation(response.data.station);
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        if (decodedText.includes('/verify-booking/')) {
            const bookingId = decodedText.split('/verify-booking/')[1];
            navigate(`/verify-booking/${bookingId}`);
        } else {
            toast.error("Invalid QR Code format");
        }
    };

    const handleStopCharging = async (chargerId) => {
        try {
            // Find active booking for this charger
            const activeBooking = bookings.find(b => b.chargerId === chargerId && b.bookingStatus === 'charging');
            if (!activeBooking) {
                // If no DB booking found, just free the charger
                updateChargerStatus(chargerId, 'available');
                return;
            }

            const response = await axios.post(`${backendURL}/api/bookings/${activeBooking._id}/stop-charging`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success("Charging stopped");
                setBillingBooking(activeBooking);
                fetchDashboardData();
            }
        } catch (error) {
            console.error("Error stopping charging:", error);
            toast.error("Failed to stop charging");
        }
    };

    const handleGenerateBill = async () => {
        if (!unitsConsumed || isNaN(unitsConsumed)) {
            toast.error("Please enter valid units");
            return;
        }

        try {
            setIsGeneratingBill(true);
            const response = await axios.post(`${backendURL}/api/bookings/${billingBooking._id}/generate-bill`, 
                { unitsConsumed: parseFloat(unitsConsumed) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success("Bill generated and sent to user");
                
                // Immediately update charger status to available after bill generation
                if (billingBooking && billingBooking.chargerId) {
                    await updateChargerStatus(billingBooking.chargerId, 'available');
                }

                setBillingBooking(null);
                setUnitsConsumed('');
                fetchDashboardData();
            }
        } catch (error) {
            console.error("Error generating bill:", error);
            toast.error("Failed to generate bill");
        } finally {
            setIsGeneratingBill(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">Initializing Systems...</p>
        </div>
    );

    if (!station) return (
        <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-slate-100 max-w-2xl mx-auto mt-10">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ZapOff size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">No Assignment Found</h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed mb-8">
                You haven't been assigned to any charging hub yet. Please contact your administrator.
            </p>
            <button
                onClick={fetchDashboardData}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
                Retry Connection
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]  space-y-4 font-sans">
            {/* --- TOP STATS ROW --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'TOTAL CHARGERS', value: station.chargers.length, sub: 'All Chargers', icon: EvCharger, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
                    { label: 'AVAILABLE', value: station.chargers.filter(c => c.status === 'available').length, sub: `${((station.chargers.filter(c => c.status === 'available').length / station.chargers.length) * 100).toFixed(1)}% Available`, icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#F0FDF4]', },
                    { label: 'OCCUPIED', value: station.chargers.filter(c => c.status === 'in_use').length, sub: `${((station.chargers.filter(c => c.status === 'in_use').length / station.chargers.length) * 100).toFixed(1)}% Occupied`, icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]', },
                    { label: 'OUT OF SERVICE', value: station.chargers.filter(c => c.status === 'maintenance').length, sub: `${((station.chargers.filter(c => c.status === 'maintenance').length / station.chargers.length) * 100).toFixed(1)}% Unavailable`, icon: Wrench, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]', },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                            <stat.icon size={24} className={stat.iconFill ? 'fill-current' : ''} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-black text-[#1E293B]">{stat.value}</p>
                            </div>
                            <p className="text-[10px] font-bold text-[#94A3B8] mt-0.5">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* --- LEFT COLUMN: CHARGERS & SUMMARY --- */}
                <div className="lg:col-span-2 space-y-8">
                    {/* CHARGERS OVERVIEW */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h3 className="text-xl font-black text-[#1E293B] tracking-tight">Chargers Overview</h3>
                                <p className="text-[10px] font-bold text-[#94A3B8] mt-0.5 uppercase tracking-widest">{station.chargers.length} Active Nodes</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1 p-1 bg-[#F8FAFC] rounded-xl">
                                    <button className="p-2 bg-white text-[#10B981] rounded-lg shadow-sm">
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button className="p-2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* DC CHARGERS ROW */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#F1F5F9]"></div>
                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] bg-[#F1F5F9] px-3 py-1 rounded-full">DC Fast Chargers</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#F1F5F9]"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {station.chargers.filter(c => c.chargerId.startsWith('DC') || c.type.toLowerCase().includes('ccs') || c.type.toLowerCase().includes('dc')).map((charger, i) => (
                                        <ChargerCard 
                                            key={i} 
                                            charger={charger} 
                                            updateChargerStatus={updateChargerStatus} 
                                            onScan={() => setIsScannerOpen(true)} 
                                            onStopCharging={handleStopCharging}
                                            activeBooking={bookings.find(b => b.chargerId === charger.chargerId && (b.bookingStatus === 'charging' || b.bookingStatus === 'billing_pending'))}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* AC CHARGERS ROW */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#F0F9FF]"></div>
                                    <span className="text-[10px] font-black text-[#0EA5E9] uppercase tracking-[0.2em] bg-[#F0F9FF] px-3 py-1 rounded-full">AC Regular Chargers</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#F0F9FF]"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {station.chargers.filter(c => c.chargerId.startsWith('AC') || c.type.toLowerCase().includes('type 2') || c.type.toLowerCase().includes('ac')).map((charger, i) => (
                                        <ChargerCard 
                                            key={i} 
                                            charger={charger} 
                                            updateChargerStatus={updateChargerStatus} 
                                            onScan={() => setIsScannerOpen(true)} 
                                            onStopCharging={handleStopCharging}
                                            activeBooking={bookings.find(b => b.chargerId === charger.chargerId && (b.bookingStatus === 'charging' || b.bookingStatus === 'billing_pending'))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* STATION SUMMARY */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-[#1E293B] mb-8">Station Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Today's Sessions", value: bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length, sub: '↑ 20% vs yesterday', icon: Clock, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
                                { label: "Total Energy (Today)", value: '240.8 kWh', sub: '↑ 18% vs yesterday', icon: Zap, color: 'text-[#6366F1]', bg: 'bg-[#EEF2FF]' },
                                { label: "Total Revenue (Today)", value: `₹${bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}`, sub: '↑ 15% vs yesterday', icon: IndianRupee, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
                                { label: "Active Sessions", value: station.chargers.filter(c => c.status === 'in_use').length, sub: 'Right now', icon: Activity, color: 'text-[#F43F5E]', bg: 'bg-[#FFF1F2]' },
                            ].map((stat, i) => (
                                <div key={i} className="p-6 rounded-[2rem] bg-[#F8FAFC] border border-slate-50 flex flex-col items-center text-center transition-all hover:bg-white hover:shadow-md">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-1.5">{stat.label}</p>
                                    <p className="text-xl font-black text-[#1E293B]">{stat.value}</p>
                                    <p className={`text-[9px] font-black mt-3 ${stat.color} uppercase tracking-widest`}>{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* --- RIGHT COLUMN: BOOKINGS & ACTIONS --- */}
                <div className="space-y-8">
                    {/* BOOKINGS MANAGEMENT */}
                    <div className="bg-white rounded-2xl p-4 min-h-96 border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-[#1E293B]">Bookings Management</h3>
                                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-0.5">{bookings.length} Total Bookings</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Zap size={10} fill="currentColor" /> Instant
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {bookings.length > 0 ? (
                                bookings.map((booking, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                                        booking.isInstant ? 'border-amber-100 bg-amber-50/20' : 'border-slate-50 bg-white'
                                    }`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                                                    booking.isInstant ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {booking.userId?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-black text-[#1E293B]">{booking.userId?.name || 'Unknown'}</p>
                                                        {booking.isInstant && (
                                                            <span className="bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">INSTANT</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-[#94A3B8]">
                                                        <Phone size={10} />
                                                        <span>{booking.userId?.mobile || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                    booking.bookingStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    booking.bookingStatus === 'charging' ? 'bg-blue-100 text-blue-700' :
                                                    booking.bookingStatus === 'billing_pending' ? 'bg-purple-100 text-purple-700' :
                                                    booking.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    booking.bookingStatus === 'pending_payment' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {booking.bookingStatus === 'pending_payment' ? 'Paying...' : (booking.bookingStatus || 'Upcoming')}
                                                </div>
                                                <p className="text-[9px] font-bold text-[#94A3B8] mt-1">{booking.date}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100/50">
                                            <div className="flex items-center gap-2">
                                                <EvCharger size={14} className="text-slate-400" />
                                                <div>
                                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Charger</p>
                                                    <p className="text-[10px] font-black text-[#1E293B]">{booking.chargerId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                <div>
                                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Time Slot</p>
                                                    <p className="text-[10px] font-black text-[#1E293B]">{booking.startTime} - {booking.endTime}</p>
                                                </div>
                                            </div>
                                            {booking.vehicleDetails && (
                                                <div className="flex items-center gap-2">
                                                    <Car size={14} className="text-slate-400" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Vehicle</p>
                                                        <p className="text-[10px] font-black text-[#1E293B] truncate max-w-[80px]">{booking.vehicleDetails.name}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <IndianRupee size={14} className="text-slate-400" />
                                                <div>
                                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">Amount</p>
                                                    <p className="text-[10px] font-black text-[#1E293B]">₹{booking.amount || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {booking.bookingStatus === 'upcoming' && (
                                            <button 
                                                onClick={() => setIsScannerOpen(true)}
                                                className="w-full mt-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                            >
                                                <QrCode size={12} /> Verify & Start
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                        <Clock size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">No bookings found</p>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* QUICK ACTIONS */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-[#1E293B] mb-8">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="p-6 bg-[#F8FAFC] rounded-[2rem] flex flex-col items-center gap-3 hover:bg-[#ECFDF5] transition-all group"
                            >
                                <div className="w-12 h-12 bg-white text-[#10B981] rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#10B981] group-hover:text-white transition-all">
                                    <QrCode size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.15em]">Scan QR</p>
                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">Scan Booking</p>
                                </div>
                            </button>
                            <button className="p-6 bg-[#F8FAFC] rounded-[2rem] flex flex-col items-center gap-3 hover:bg-[#F0FDF4] transition-all group">
                                <div className="w-12 h-12 bg-white text-[#10B981] rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#10B981] group-hover:text-white transition-all">
                                    <Play size={24} className="fill-current ml-1" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.15em]">Start Session</p>
                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">Manual Start</p>
                                </div>
                            </button>
                            <button className="p-6 bg-[#F8FAFC] rounded-[2rem] flex flex-col items-center gap-3 hover:bg-[#FEF2F2] transition-all group">
                                <div className="w-12 h-12 bg-white text-[#EF4444] rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#EF4444] group-hover:text-white transition-all">
                                    <Square size={20} fill="currentColor" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.15em]">Stop Session</p>
                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">Manual Stop</p>
                                </div>
                            </button>
                            <button className="p-6 bg-[#F8FAFC] rounded-[2rem] flex flex-col items-center gap-3 hover:bg-[#FFFBEB] transition-all group">
                                <div className="w-12 h-12 bg-white text-[#F59E0B] rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#F59E0B] group-hover:text-white transition-all">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-[#1E293B] uppercase tracking-[0.15em]">Report Issue</p>
                                    <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">Raise Ticket</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* HELP SECTION */}
                    <div className="bg-[#F0FDF4]/50 rounded-[2rem] p-6 border border-[#DCFCE7] flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-white text-[#10B981] rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12">
                                <HelpCircle size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-[#1E293B]">Need Help?</p>
                                <p className="text-[9px] font-bold text-[#64748B] mt-0.5">Contact support if you face any issues</p>
                            </div>
                        </div>
                        <button className="bg-white px-4 py-2 rounded-xl text-[9px] font-black text-[#10B981] border border-[#DCFCE7] shadow-sm hover:bg-[#10B981] hover:text-white transition-all flex items-center gap-2">
                            Contact Support <ArrowUpRight size={12} />
                        </button>
                    </div>
                </div>
            </div>


            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />

            {/* Billing Modal */}
            {billingBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="bg-emerald-600 p-8 text-white">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Generate Bill</h3>
                                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Session ID: {billingBooking._id.slice(-8)}</p>
                                </div>
                                <button onClick={() => setBillingBooking(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <ZapOff size={24} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <p className="font-black text-sm">{billingBooking.userId?.name || 'Customer'}</p>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">{billingBooking.chargerId} • {billingBooking.date}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Units Consumed (kWh)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={unitsConsumed}
                                        onChange={(e) => setUnitsConsumed(e.target.value)}
                                        placeholder="e.g. 15.5"
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-xl font-black text-gray-800 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm uppercase">kWh</div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Estimated Total</p>
                                    <p className="text-2xl font-black text-emerald-600">
                                        ₹{unitsConsumed ? (parseFloat(unitsConsumed) * (billingBooking.stationId?.chargers?.find(c => c.chargerId === billingBooking.chargerId)?.price || 15)).toFixed(2) : '0.00'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateBill}
                                disabled={isGeneratingBill || !unitsConsumed}
                                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                            >
                                {isGeneratingBill ? (
                                    <>
                                        <RefreshCcw size={20} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCheck size={20} />
                                        Generate & Send Bill
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorDashboard;
