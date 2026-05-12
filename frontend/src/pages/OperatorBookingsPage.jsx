import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectToken } from '../features/auth/authSelectors';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Clock, Search, Filter, Calendar, 
    User as UserIcon, Phone, Car, EvCharger, 
    IndianRupee, QrCode, ChevronRight, RefreshCcw,
    CheckCircle2, AlertCircle, X, Download, Eye, Zap
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';
import { useNavigate } from 'react-router-dom';

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const OperatorBookingsPage = () => {
    const user = useSelector(selectUser);
    const token = useSelector(selectToken);
    const navigate = useNavigate();

    const [station, setStation] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            // 1. Get assigned station
            const stationRes = await axios.get(`${backendURL}/api/stations/operator/my-station`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (stationRes.data.success) {
                const stationData = stationRes.data.station;
                setStation(stationData);

                // 2. Get bookings for this station
                const bookingsRes = await axios.get(`${backendURL}/api/bookings/station/${stationData._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (bookingsRes.data.success) {
                    // Sort bookings by date/time (most recent first)
                    const sortedBookings = [...bookingsRes.data.bookings].sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    setBookings(sortedBookings);
                    setFilteredBookings(sortedBookings);
                }
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Apply search and filters
    useEffect(() => {
        let result = bookings;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(b => 
                b.userId?.name?.toLowerCase().includes(query) || 
                b.userId?.mobile?.includes(query) ||
                b.chargerId?.toLowerCase().includes(query) ||
                b._id.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(b => b.bookingStatus === statusFilter);
        }

        setFilteredBookings(result);
    }, [searchQuery, statusFilter, bookings]);

    const handleScanSuccess = (decodedText) => {
        setIsScannerOpen(false);
        if (decodedText.includes('/verify-booking/')) {
            const bookingId = decodedText.split('/verify-booking/')[1];
            navigate(`/verify-booking/${bookingId}`);
        } else {
            toast.error("Invalid QR Code format");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'charging': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'billing_pending': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'upcoming': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'pending_payment': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">Syncing Database...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* --- HEADER & FILTERS --- */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col gap-5">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Bookings Management</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {station?.name || 'Assigned Hub'} • {bookings.length} Total Records
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search bookings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                            />
                        </div>
                        
                        {/* Filters & Scan Button Group */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex-1 md:flex-none flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
                                {['all', 'upcoming', 'charging', 'completed', 'cancelled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                            statusFilter === status 
                                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setIsScannerOpen(true)}
                                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 shrink-0"
                                title="Scan QR Code"
                            >
                                <QrCode size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOOKINGS LIST --- */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Charger & Vehicle</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking, i) => (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                                                    booking.isInstant ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {booking.userId?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-black text-slate-800">{booking.userId?.name || 'Unknown'}</p>
                                                        {booking.isInstant && (
                                                            <span className="bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">INSTANT</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
                                                        <Phone size={10} />
                                                        <span>{booking.userId?.mobile || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <EvCharger size={12} className="text-slate-400" />
                                                    <span className="text-xs font-black text-slate-700">{booking.chargerId}</span>
                                                </div>
                                                {booking.vehicleDetails && (
                                                    <div className="flex items-center gap-2">
                                                        <Car size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500">{booking.vehicleDetails.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span className="text-xs font-black text-slate-700">{booking.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500">{booking.startTime} - {booking.endTime}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(booking.bookingStatus)}`}>
                                                {booking.bookingStatus === 'pending_payment' ? 'Paying...' : (booking.bookingStatus || 'Upcoming')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {booking.bookingStatus === 'upcoming' && (
                                                    <button 
                                                        onClick={() => setIsScannerOpen(true)}
                                                        className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                                                    >
                                                        <QrCode size={12} /> Verify
                                                    </button>
                                                )}
                                                <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                            <Search size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No matching bookings found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, i) => (
                            <div key={i} className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                                            booking.isInstant ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {booking.userId?.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-slate-800">{booking.userId?.name || 'Unknown'}</p>
                                                {booking.isInstant && (
                                                    <span className="bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">INSTANT</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400">{booking.userId?.mobile || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusColor(booking.bookingStatus)}`}>
                                        {booking.bookingStatus === 'pending_payment' ? 'Paying...' : (booking.bookingStatus || 'Upcoming')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Charger</p>
                                        <div className="flex items-center gap-2">
                                            <EvCharger size={12} className="text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-700">{booking.chargerId}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-700">{booking.startTime} - {booking.endTime}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar size={12} />
                                        <span className="text-[10px] font-bold">{booking.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {booking.bookingStatus === 'upcoming' && (
                                            <button 
                                                onClick={() => setIsScannerOpen(true)}
                                                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2"
                                            >
                                                <QrCode size={12} /> Verify
                                            </button>
                                        )}
                                        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 md:py-20 text-center px-6">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <Search size={24} className="md:hidden" />
                                <Search size={32} className="hidden md:block" />
                            </div>
                            <p className="text-xs md:text-sm font-bold text-slate-400">No matching bookings found</p>
                        </div>
                    )}
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

export default OperatorBookingsPage;
