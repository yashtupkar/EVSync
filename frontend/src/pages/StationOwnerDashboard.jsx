import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectToken } from '../features/auth/authSelectors';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Zap, MapPin, TrendingUp, Plus, Settings, 
    CheckCircle2, Clock, Activity, Eye, Image,
    ChevronRight, Wallet, Calendar, Monitor, 
    AlertCircle, ArrowUpRight, IndianRupee, Users, MoreVertical, DollarSign, UserPlus, X, RefreshCcw
} from 'lucide-react';

import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import AddStationForm from '../components/AddStationForm';
import { Link } from 'react-router-dom';

const backendURL = import.meta.env.VITE_BACKEND_URL;

// Mock Data (matching Admin Panel style)
const revenueData = [
    { day: 'Mon', revenue: 2100 },
    { day: 'Tue', revenue: 2800 },
    { day: 'Wed', revenue: 2600 },
    { day: 'Thu', revenue: 3200 },
    { day: 'Fri', revenue: 3000 },
    { day: 'Sat', revenue: 4500 },
    { day: 'Sun', revenue: 5800 },
];

const bookingDonutData = [
    { name: 'Completed', value: 82, color: '#10b981' },
    { name: 'Upcoming', value: 26, color: '#FFB800' },
    { name: 'Cancelled', value: 16, color: '#C084FC' },
];

const chargerDonutData = [
    { name: 'Active', value: 3, color: '#10b981' },
    { name: 'In Use', value: 2, color: '#FFB800' },
    { name: 'Offline', value: 0, color: '#EF4444' },
];

const StationOwnerDashboard = ({ tab = 'dashboard' }) => {
    const user = useSelector(selectUser);
    const token = useSelector(selectToken);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTab, setActiveTab] = useState(tab);
    
    // Operator assignment states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningStationId, setAssigningStationId] = useState(null);
    const [operatorData, setOperatorData] = useState({ name: '', email: '' });
    const [assigning, setAssigning] = useState(false);


    useEffect(() => {
        setActiveTab(tab);
    }, [tab]);

    useEffect(() => {
        fetchStations();
    }, []);


    const fetchStations = async () => {
        try {
            const response = await axios.get(`${backendURL}/api/station-owner/my-stations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStations(response.data.stations);
        } catch (error) {
            console.error("Error fetching stations:", error);
            toast.error("Failed to load your stations");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignOperator = async (e) => {
        e.preventDefault();
        if (!operatorData.email || !operatorData.name) {
            toast.error("Please fill all details");
            return;
        }

        try {
            setAssigning(true);
            const res = await axios.post(`${backendURL}/api/station-owner/assign-operator`, {
                stationId: assigningStationId,
                operatorEmail: operatorData.email,
                operatorName: operatorData.name
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Operator assigned successfully!");
                setShowAssignModal(false);
                setOperatorData({ name: '', email: '' });
                fetchStations();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign operator");
        } finally {
            setAssigning(false);
        }
    };


    if (showAddForm) {
        return <AddStationForm onCancel={() => setShowAddForm(false)} onSuccess={() => {
            setShowAddForm(false);
            fetchStations();
        }} />;
    }

    const hasApprovedStation = stations.some(s => s.status === 'approved');

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            
            {/* Empty State: No Stations Added */}
            {stations.length === 0 && !loading && (
                <div className="bg-white rounded-[2rem] p-12 border border-slate-100 shadow-sm text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-inner rotate-3">
                            <Zap size={40} className="fill-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
                            Ready to power up the <span className="text-emerald-500">future?</span>
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                            Join our network today and start earning by providing sustainable energy to EV drivers in your area.
                        </p>
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 mx-auto"
                        >
                            <Plus size={20} /> Add Your First Station
                        </button>
                    </div>
                </div>
            )}

            {/* Pending State */}
            {stations.length > 0 && !hasApprovedStation && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-8 relative overflow-hidden">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                        <Clock size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Station Under Review</h2>
                        <p className="text-slate-500 text-sm font-medium">Your registration is being verified. Full tools will unlock upon approval.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="ml-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        Add Another Station
                    </button>
                </div>
            )}

            {hasApprovedStation && (
                <>
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Stats Row - Compact Admin Style */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard 
                                    icon={<MapPin size={20} />} 
                                    label="My Stations" 
                                    value={stations.length} 
                                    trend={`${stations.filter(s => s.status === 'approved').length} Active`} 
                                    color="green"
                                />
                                <StatCard 
                                    icon={<Calendar size={20} />} 
                                    label="Total Bookings" 
                                    value="124" 
                                    trend="18% this week" 
                                    isPositive={true}
                                    color="blue"
                                />
                                <StatCard 
                                    icon={<IndianRupee size={20} />} 
                                    label="Total Revenue" 
                                    value="₹8,430" 
                                    trend="22% this week" 
                                    isPositive={true}
                                    color="yellow"
                                />
                                <StatCard 
                                    icon={<Zap size={20} />} 
                                    label="Active Chargers" 
                                    value="3 / 5" 
                                    trend="60% in use" 
                                    color="purple"
                                />
                            </div>

                            {/* Middle Row: Charts */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                                <div className="xl:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Revenue Analytics</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">Weekly</span>
                                            <div className="w-8 h-4 bg-emerald-100 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-emerald-500 rounded-full"></div></div>
                                        </div>
                                    </div>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} tickFormatter={(value) => `₹${value/1000}K`} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="xl:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-widest mb-6">Bookings Distribution</h3>
                                    <div className="h-[180px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={bookingDonutData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                    {bookingDonutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-black text-slate-900">124</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 space-y-2">
                                        {bookingDonutData.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-slate-500">{item.name}</span>
                                                </div>
                                                <span className="text-slate-800">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {(activeTab === 'dashboard' || activeTab === 'stations') && (
                        /* Bottom Row: Stations List */
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">
                                    {activeTab === 'stations' ? 'My Charging Stations' : 'Recent Stations'}
                                </h3>
                                <button 
                                    onClick={() => setShowAddForm(true)}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stations.map(station => (
                                    <CompactStationCard 
                                        key={station._id} 
                                        station={station} 
                                        onAssignOperator={() => {
                                            setAssigningStationId(station._id);
                                            setShowAssignModal(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}


                    {activeTab === 'bookings' && (
                        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-xl font-black text-slate-800">Bookings Management</h3>
                            <p className="text-slate-400 font-medium mt-2">Manage all your customer appointments in one place.</p>
                            <div className="mt-10 p-8 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold">
                                No active bookings to display
                            </div>
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
                            <IndianRupee size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-xl font-black text-slate-800">Earnings & Payouts</h3>
                            <p className="text-slate-400 font-medium mt-2">Track your revenue and manage bank transfers.</p>
                            <div className="mt-10 p-8 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold">
                                Your first payout will be eligible after ₹5,000 revenue
                            </div>
                        </div>
                    )}

                </>
            )}

            {/* Assign Operator Modal */}
            {showAssignModal && (

                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Assign Operator</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">Assign a manned operator to this station.</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignOperator} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Operator Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Full name of operator"
                                    value={operatorData.name}
                                    onChange={(e) => setOperatorData({...operatorData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Operator Email</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                    placeholder="email@example.com"
                                    value={operatorData.email}
                                    onChange={(e) => setOperatorData({...operatorData, email: e.target.value})}
                                />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={assigning}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                                >
                                    {assigning ? <RefreshCcw size={16} className="animate-spin" /> : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};

// --- Compact Sub-Components ---

const StatCard = ({ icon, label, value, trend, isPositive, color }) => {
    const colorStyles = {
        green: 'bg-emerald-50 text-emerald-500',
        blue: 'bg-blue-50 text-blue-500',
        yellow: 'bg-yellow-50 text-yellow-500',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer">
            <div className={`${colorStyles[color]} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div className="overflow-hidden">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5 truncate">{label}</p>
                <h3 className="text-xl font-black text-slate-900 leading-none">{value}</h3>
                <p className={`text-[9px] font-bold mt-1.5 ${isPositive ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
};

const CompactStationCard = ({ station, onAssignOperator }) => {

    return (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 group hover:bg-white hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    {station.images?.[0] ? <img src={station.images[0]} className="w-full h-full object-cover" /> : <Zap size={20} className="m-auto mt-3 text-slate-400" />}
                </div>
                <div className="overflow-hidden">
                    <h4 className="text-sm font-black text-slate-800 truncate">{station.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                        <MapPin size={10} /> {station.address.split(',')[0]}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/50 p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Chargers</p>
                    <p className="text-xs font-black text-slate-800">{station.chargers?.length || 0}</p>
                </div>
                <div className="bg-white/50 p-2 rounded-lg border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Type</p>
                    <p className="text-xs font-black text-slate-800 capitalize">{station.stationType}</p>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${station.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {station.status === 'approved' ? 'Active' : station.status}
                </span>
                <div className="flex items-center gap-2">
                    {station.stationType === 'manned' && station.status === 'approved' && (
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                onAssignOperator();
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                            title="Assign Operator"
                        >
                            <UserPlus size={16} />
                        </button>
                    )}
                    <button className="p-1.5 text-slate-300 hover:text-emerald-500 transition-all"><ArrowUpRight size={16} /></button>
                </div>

            </div>
        </div>
    );
};

export default StationOwnerDashboard;
