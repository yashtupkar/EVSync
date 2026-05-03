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
    ChevronRight
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';
import { useNavigate } from 'react-router-dom';

const backendURL = import.meta.env.VITE_BACKEND_URL;

const OperatorDashboard = () => {
    const user = useSelector(selectUser);
    const token = useSelector(selectToken);
    
    const [station, setStation] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('live');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
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
                    setBookings(bookingsRes.data.bookings);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // toast.error("Failed to load station data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

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
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-8 font-sans">
            {/* --- TOP STATS ROW --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'TOTAL CHARGERS', value: station.chargers.length, sub: 'All Chargers', icon: Battery, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', iconFill: true },
                    { label: 'AVAILABLE', value: station.chargers.filter(c => c.status === 'available').length, sub: `${((station.chargers.filter(c => c.status === 'available').length / station.chargers.length) * 100).toFixed(1)}% Available`, icon: CheckCircle2, color: 'text-[#10B981]', bg: 'bg-[#F0FDF4]', iconFill: true },
                    { label: 'OCCUPIED', value: station.chargers.filter(c => c.status === 'in_use').length, sub: `${((station.chargers.filter(c => c.status === 'in_use').length / station.chargers.length) * 100).toFixed(1)}% Occupied`, icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]', iconFill: false },
                    { label: 'OUT OF SERVICE', value: station.chargers.filter(c => c.status === 'maintenance').length, sub: `${((station.chargers.filter(c => c.status === 'maintenance').length / station.chargers.length) * 100).toFixed(1)}% Unavailable`, icon: Wrench, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]', iconFill: false },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <stat.icon size={28} className={stat.iconFill ? 'fill-current' : ''} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-[#1E293B]">{stat.value}</p>
                            </div>
                            <p className="text-[10px] font-bold text-[#94A3B8] mt-0.5">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- LEFT COLUMN: CHARGERS & SUMMARY --- */}
                <div className="lg:col-span-2 space-y-8">
                    {/* CHARGERS OVERVIEW */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-[#1E293B]">Chargers Overview</h3>
                                <p className="text-xs font-bold text-[#94A3B8] mt-1">{station.chargers.length} Chargers</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select className="bg-[#F8FAFC] border-none text-[10px] font-bold text-[#64748B] rounded-xl px-4 py-2 outline-none cursor-pointer focus:ring-0">
                                    <option>All Chargers</option>
                                    <option>Available</option>
                                    <option>Occupied</option>
                                </select>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {station.chargers.map((charger, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm hover:border-[#ECFDF5] transition-all group relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                charger.status === 'available' ? 'bg-[#F0FDF4] text-[#10B981]' :
                                                charger.status === 'in_use' ? 'bg-[#FFFBEB] text-[#F59E0B]' :
                                                'bg-[#FEF2F2] text-[#EF4444]'
                                            }`}>
                                                <Battery size={24} className={charger.status === 'available' ? 'fill-[#10B981]' : ''} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-[#1E293B] uppercase tracking-tight">{charger.chargerId}</p>
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        charger.status === 'available' ? 'bg-[#10B981]' :
                                                        charger.status === 'in_use' ? 'bg-[#F59E0B]' :
                                                        'bg-[#EF4444]'
                                                    }`} />
                                                </div>
                                                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">{charger.type} • {charger.power} kW</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center mb-8">
                                        <div className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm ${
                                            charger.status === 'available' ? 'bg-[#F0FDF4] text-[#10B981]' :
                                            charger.status === 'in_use' ? 'bg-[#FFFBEB] text-[#F59E0B]' :
                                            'bg-[#FEF2F2] text-[#EF4444]'
                                        }`}>
                                            {charger.status === 'available' ? 'Available' : charger.status === 'in_use' ? 'Occupied' : 'Out of Service'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-[#F8FAFC] pt-6">
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em]">Session</p>
                                            <p className="text-xs font-black text-[#1E293B] mt-1.5">{charger.status === 'in_use' ? 'S-240503001' : '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em]">Energy</p>
                                            <p className="text-xs font-black text-[#1E293B] mt-1.5">{charger.status === 'in_use' ? '12.4 kWh' : '-'}</p>
                                        </div>
                                    </div>
                                    
                                    {charger.status === 'in_use' && (
                                        <div className="mt-6 p-4 bg-[#F8FAFC] rounded-2xl flex justify-between items-center border border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.15em]">Since</p>
                                                <p className="text-[11px] font-black text-[#1E293B] mt-0.5">15 min</p>
                                            </div>
                                            <button 
                                                onClick={() => updateChargerStatus(charger.chargerId, 'available')}
                                                className="px-5 py-2 bg-white text-[#EF4444] text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border border-[#FEE2E2] shadow-sm hover:bg-[#FEF2F2] transition-all"
                                            >
                                                Stop
                                            </button>
                                        </div>
                                    )}

                                    {charger.status === 'maintenance' && (
                                        <div className="mt-6 p-4 bg-[#FEF2F2] rounded-2xl border border-[#FEE2E2]">
                                            <p className="text-[9px] font-black text-[#EF4444] uppercase tracking-[0.15em]">Issue</p>
                                            <p className="text-[11px] font-black text-[#B91C1C] mt-0.5">Connector Fault</p>
                                        </div>
                                    )}

                                    {charger.status === 'available' && (
                                        <div className="mt-6">
                                            <button 
                                                onClick={() => updateChargerStatus(charger.chargerId, 'in_use')}
                                                className="w-full py-3 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] transition-all"
                                            >
                                                Manual Start
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* STATION SUMMARY */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
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
                    {/* RECENT BOOKINGS */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-[#1E293B]">Recent Bookings</h3>
                            <button className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em] hover:underline">View All</button>
                        </div>
                        <div className="space-y-6">
                            {(bookings.length > 0 ? bookings : [
                                { userId: { name: 'Amit Rawat' }, chargerId: 'DC-03', amount: 365, paymentStatus: 'in_progress', time: '15 min ago' },
                                { userId: { name: 'Priya Singh' }, chargerId: 'AC-03', amount: 365, paymentStatus: 'in_progress', time: '32 min ago' },
                                { userId: { name: 'Rohit Kumar' }, chargerId: 'DC-01', amount: 365, paymentStatus: 'paid', time: '1 hr ago' },
                                { userId: { name: 'Neha Sharma' }, chargerId: 'AC-02', amount: 280, paymentStatus: 'paid', time: '2 hr ago' },
                                { userId: { name: 'Vikram Gupta' }, chargerId: 'DC-02', amount: 365, paymentStatus: 'paid', time: '3 hr ago' },
                            ]).slice(0, 5).map((booking, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-2xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#64748B] font-black text-xs">
                                            {booking.userId?.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#1E293B]">{booking.userId?.name || 'Unknown'}</p>
                                            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">{booking.chargerId} • CCS2 • 50 kW</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] mb-1 inline-block ${
                                                booking.paymentStatus === 'paid' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FFFBEB] text-[#F59E0B]'
                                            }`}>
                                                {booking.paymentStatus === 'paid' ? 'Completed' : 'In Progress'}
                                            </div>
                                            <p className="text-[9px] font-bold text-[#94A3B8]">{booking.time || '15 min ago'}</p>
                                        </div>
                                        {booking.paymentStatus === 'paid' && (
                                            <p className="text-xs font-black text-[#1E293B] w-12">₹{booking.amount}</p>
                                        )}
                                        {booking.paymentStatus === 'in_progress' && (
                                            <ChevronRight size={16} className="text-[#CBD5E1] group-hover:text-[#64748B] transition-colors" />
                                        )}
                                    </div>
                                </div>
                            ))}
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
        </div>
    );
};

export default OperatorDashboard;
