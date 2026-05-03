import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Zap,
    MapPin,
    Users,
    TrendingUp,
    Plus,
    Settings,
    MoreVertical,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Filter,
    LayoutDashboard,
    Activity,
    UserPlus,
    Eye,
    Image,
    ChevronRight,
    Wallet,
    Calendar,
    Bell,
    ClipboardList,
    DollarSign,
    Monitor,
    AlertCircle,
    ArrowUpRight,
    Shield,
    ArrowRight
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import {
    getAllStations,
    getAllUsers,
    getPendingStationRequests,
} from '../api/stationApi';
import { selectToken } from '../features/auth/authSelectors';
import { adminSidebarItems } from '../config/adminSidebar';

// Mock Data for Charts (matching the requested UI)
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
    { name: 'Completed', value: 82, color: '#10b981' }, // emerald-500
    { name: 'Upcoming', value: 26, color: '#FFB800' },
    { name: 'Cancelled', value: 16, color: '#C084FC' },
];

const chargerDonutData = [
    { name: 'Active', value: 3, color: '#10b981' }, // emerald-500
    { name: 'In Use', value: 2, color: '#FFB800' },
    { name: 'Offline', value: 0, color: '#EF4444' },
];

const AdminPanel = () => {
    const token = useSelector(selectToken);
    const [stations, setStations] = useState([]);
    const [users, setUsers] = useState([]);
    const [pendingStations, setPendingStations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchAdminData();
        }
    }, [token]);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [stationsResponse, usersResponse, pendingResponse] = await Promise.all([
                getAllStations(),
                getAllUsers(token),
                getPendingStationRequests(token),
            ]);

            setStations(stationsResponse.data || []);
            setUsers(usersResponse.data?.users || []);
            setPendingStations(pendingResponse.data?.stations || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error(error.response?.data?.message || 'Failed to load admin panel');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const approvedCount = stations.filter((station) => station.status === 'approved').length;
        const pendingCount = stations.filter((station) => station.status === 'pending').length;

        return {
            totalStations: stations.length,
            totalUsers: users.length,
            pendingCount,
            approvedCount,
            totalBookings: 124, // Mocked for UI match
            totalRevenue: '₹8,430', // Mocked for UI match
            activeChargers: '3 / 5', // Mocked for UI match
        };
    }, [stations, users.length]);

    return (
            <div className="space-y-4 animate-in fade-in duration-700">
                
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard 
                        icon={<MapPin size={20} />} 
                        label="Total Stations" 
                        value={stats.totalStations} 
                        trend={`${stats.approvedCount} Active • ${stats.pendingCount} Pending`} 
                        color="green"
                        to="/admin/station-requests"
                    />
                    <StatCard 
                        icon={<Calendar size={20} />} 
                        label="Total Bookings" 
                        value={stats.totalBookings} 
                        trend="18% this week" 
                        isPositive={true}
                        color="blue"
                    />
                    <StatCard 
                        icon={<Wallet size={20} />} 
                        label="Total Revenue" 
                        value={stats.totalRevenue} 
                        trend="22% this week" 
                        isPositive={true}
                        color="yellow"
                    />
                    <StatCard 
                        icon={<Zap size={20} />} 
                        label="Active Chargers" 
                        value={stats.activeChargers} 
                        trend="60% in use" 
                        color="purple"
                    />
                </div>

                {/* Middle Row: Charts & Activity */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* Revenue Overview */}
                    <div className="xl:col-span-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Revenue Overview</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-2xl font-black text-slate-900">{stats.totalRevenue}</span>
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+22%</span>
                                </div>
                            </div>
                            <select className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 outline-none">
                                <option>This Week</option>
                                <option>Last Month</option>
                            </select>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                                        tickFormatter={(value) => `₹${value/1000}K`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 800, marginBottom: '4px' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bookings Overview */}
                    <div className="xl:col-span-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-8">Bookings Overview</h3>
                        <div className="h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={bookingDonutData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {bookingDonutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-900">124</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                            </div>
                        </div>
                        <div className="mt-8 space-y-3">
                            {bookingDonutData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[11px] font-bold text-slate-500">{item.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black text-slate-800">{item.value} ({Math.round(item.value/124*100)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="xl:col-span-3 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-slate-800">Recent Activity</h3>
                            <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="space-y-6">
                            <ActivityItem icon={<CheckCircle2 size={16} />} title="Booking completed" station="GreenCharge Station" time="2m ago" color="green" />
                            <ActivityItem icon={<Clock size={16} />} title="New booking received" station="GreenCharge Station" time="15m ago" color="yellow" />
                            <ActivityItem icon={<Zap size={16} />} title="Charger AC-01 is now offline" station="GreenCharge Station" time="1h ago" color="purple" />
                            <ActivityItem icon={<CheckCircle2 size={16} />} title="Payout of ₹2,350 processed" station="EVSync Platform" time="1h ago" color="green" />
                            <ActivityItem icon={<Activity size={16} />} title="New station pending approval" station="PowerHub Station" time="2h ago" color="blue" />
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Your Stations & Charger Status */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Global Stations List */}
                    <div className="xl:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800">Your Stations</h3>
                            <Link 
                                to="/admin/station-requests"
                                className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all"
                            >
                                <Plus size={14} /> Add New Station
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="py-20 text-center text-slate-400 text-sm font-bold animate-pulse">
                                    Loading network stations...
                                </div>
                            ) : stations.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4"><MapPin size={32} /></div>
                                    <h4 className="font-bold text-slate-800">No stations registered yet</h4>
                                    <p className="text-sm text-slate-400 font-medium mt-1">New stations will appear here after owners register them.</p>
                                </div>
                            ) : (
                                stations.slice(0, 5).map(station => (
                                    <StationListCard key={station._id} station={station} />
                                ))
                            )}
                        </div>
                        <div className="mt-8 flex justify-center">
                            <Link to="/admin/station-requests" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 hover:underline">
                                View All Stations <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Right Side Widgets */}
                    <div className="xl:col-span-4 space-y-8">
                        {/* Charger Status */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-lg font-black text-slate-800">Charger Status</h3>
                                <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">View All</button>
                            </div>
                            <div className="h-[180px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chargerDonutData}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chargerDonutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-black text-slate-900">5</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-1 gap-3">
                                {chargerDonutData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[11px] font-bold text-slate-500">{item.name}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-800">{item.value} ({Math.round(item.value/5*100)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operational Card */}
                        <div className="bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-black text-emerald-700">All systems operational</h4>
                                <p className="text-[10px] text-emerald-600/70 font-medium">Your charging network is running smoothly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
       
    );
};

// --- Sub-Components ---

const StatCard = ({ icon, label, value, trend, isPositive, color, to }) => {
    const colorStyles = {
        green: 'bg-emerald-50 text-emerald-500',
        blue: 'bg-blue-50 text-blue-500',
        yellow: 'bg-yellow-50 text-yellow-500',
        purple: 'bg-purple-50 text-purple-600',
        indigo: 'bg-indigo-50 text-indigo-500',
    };

    const content = (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-2">
                <div className={`${colorStyles[color]} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
             
                <div className="flex items-center gap-1 mt-2">
                    {isPositive !== undefined && (
                        <ArrowUpRight size={10} className={isPositive ? 'text-emerald-500' : 'text-red-500'} />
                    )}
                    <span className={`text-[10px] font-bold ${isPositive === undefined ? 'text-slate-400' : isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trend}
                    </span>
                </div>
                   </div>
            </div>
            <div className="text-slate-200 group-hover:text-slate-300 transition-all">
                <ChevronRight size={20} />
            </div>
        </div>
    );

    return to ? <Link to={to}>{content}</Link> : content;
};

const ActivityItem = ({ icon, title, station, time, color }) => {
    const colorStyles = {
        green: 'bg-emerald-50 text-emerald-500',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
        blue: 'bg-blue-50 text-blue-600'
    };

    return (
        <div className="flex items-center gap-4">
            <div className={`${colorStyles[color]} w-10 h-10 rounded-2xl flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="text-[11px] font-black text-slate-800 leading-tight">{title}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{station}</p>
            </div>
            <span className="text-[9px] font-bold text-slate-300 whitespace-nowrap">{time}</span>
        </div>
    );
};

const StationListCard = ({ station }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-600';
            case 'pending': return 'bg-yellow-100 text-yellow-600';
            case 'rejected': return 'bg-red-100 text-red-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="bg-white border border-slate-50 rounded-3xl p-5 flex items-center gap-6 group hover:bg-slate-50/50 transition-all border-b border-slate-100">
            <div className="w-20 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100 shadow-inner">
                {station.images?.[0] ? (
                    <img src={station.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Image size={24} /></div>
                )}
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-3">
                    <h4 className="text-base font-black text-slate-800 leading-none">{station.name}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusBadge(station.status)}`}>
                        {station.status === 'approved' ? 'Active' : station.status}
                    </span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin size={12} />
                        <span className="text-[10px] font-bold">{station.address?.split(',')[0] || 'Unknown Location'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Zap size={12} />
                        <span className="text-[10px] font-bold">{station.chargers?.length || 0} Chargers</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Users size={12} />
                        <span className="text-[10px] font-bold capitalize">{station.stationType || 'Manned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <DollarSign size={12} />
                        <span className="text-[10px] font-bold">₹ {station.costPerUnit || '15.00'} / kWh</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-10 px-6 border-l border-slate-50">
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bookings</p>
                    <p className="text-sm font-black text-slate-800">{station.totalBookings || Math.floor(Math.random() * 100)}</p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                    <p className="text-sm font-black text-slate-800">₹{station.totalRevenue || Math.floor(Math.random() * 5000)}</p>
                </div>
                <Link to="/admin/station-requests" className="p-2.5 bg-slate-50 text-slate-300 hover:text-indigo-500 rounded-xl transition-all">
                    <ArrowUpRight size={20} />
                </Link>
            </div>
            <button className="p-2 text-slate-200 hover:text-slate-400 transition-all opacity-0 group-hover:opacity-100">
                <MoreVertical size={20} />
            </button>
        </div>
    );
};

export default AdminPanel;
