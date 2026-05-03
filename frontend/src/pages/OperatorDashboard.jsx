import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectToken } from '../features/auth/authSelectors';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Zap, MapPin, Clock, LayoutDashboard, 
    Activity, Battery, CheckCircle, AlertCircle, RefreshCcw,
    Users, Settings, HardHat
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const backendURL = import.meta.env.VITE_BACKEND_URL;

const OperatorDashboard = () => {
    const user = useSelector(selectUser);
    const token = useSelector(selectToken);
    
    const [assignedStation, setAssignedStation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('live');

    useEffect(() => {
        fetchAssignedStation();
    }, []);

    const fetchAssignedStation = async () => {
        try {
            const response = await axios.get(`${backendURL}/api/stations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const station = response.data.find(s => s.operatorIds?.includes(user._id));
            setAssignedStation(station);
        } catch (error) {
            console.error("Error fetching station:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateChargerStatus = async (chargerIndex, newStatus) => {
        toast.success(`Charger marked as ${newStatus}`);
    };

    const sidebarItems = [
        { id: 'live', label: 'Live Monitoring', icon: Activity, onClick: () => setActiveTab('live'), activeTab },
        { id: 'queue', label: 'Booking Queue', icon: Clock, onClick: () => setActiveTab('queue'), activeTab },
        { id: 'maintenance', label: 'Maintenance', icon: Settings, onClick: () => setActiveTab('maintenance'), activeTab },
        { id: 'support', label: 'Help Desk', icon: HardHat, onClick: () => setActiveTab('support'), activeTab },
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <RefreshCcw className="animate-spin text-[#1BAC4B]" size={40} />
        </div>
    );

    return (
        <DashboardLayout 
            sidebarItems={sidebarItems} 
            theme="slate" 
            roleName="On-Site Operator"
        >
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-10 mb-10 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1BAC4B]/5 rounded-bl-[5rem] -z-0" />
                
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-slate-900 text-[#1BAC4B] rounded-3xl flex items-center justify-center font-black text-3xl italic shadow-xl shadow-slate-200">
                        {user?.name?.[0] || 'O'}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Operational <span className="text-[#1BAC4B]">Center</span></h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Station: <span className="text-slate-800">{assignedStation?.name || 'Searching assignment...'}</span></p>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    <div className="px-6 py-3 bg-green-50 text-[#1BAC4B] rounded-2xl border border-green-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#1BAC4B] animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </div>

            {!assignedStation ? (
                <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Activity size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Deployment Pending</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto text-lg leading-relaxed">
                        Your profile is active, but you haven't been assigned to a specific charging hub yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    {/* Live Status Panel */}
                    <div className="xl:col-span-2 space-y-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                                    <div className="p-2.5 bg-green-50 text-[#1BAC4B] rounded-xl"><Zap size={20} fill="currentColor" /></div>
                                    Live Infrastructure Status
                                </h3>
                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-all"><RefreshCcw size={18} /></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {assignedStation.chargers?.map((charger, i) => (
                                    <div key={i} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group hover:border-[#1BAC4B]/30 transition-all">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${charger.status === 'available' ? 'bg-[#1BAC4B] text-white shadow-green-100' : 'bg-orange-500 text-white shadow-orange-100'}`}>
                                                    <Battery size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-lg leading-tight">{charger.type}</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{charger.power}kW Fast Charge</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${charger.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {charger.status}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => updateChargerStatus(i, 'available')}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${charger.status === 'available' ? 'bg-white border-2 border-[#1BAC4B] text-[#1BAC4B]' : 'bg-white border border-slate-200 text-slate-400 hover:border-[#1BAC4B] hover:text-[#1BAC4B]'}`}
                                            >
                                                Mark Free
                                            </button>
                                            <button 
                                                onClick={() => updateChargerStatus(i, 'in_use')}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${charger.status === 'in_use' ? 'bg-white border-2 border-orange-500 text-orange-500' : 'bg-white border border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-500'}`}
                                            >
                                                Mark Busy
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-xl shadow-slate-200 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-[10rem] -z-0 translate-x-10 -translate-y-10" />
                            <h3 className="text-xl font-black text-white mb-8 relative z-10 flex items-center gap-3">
                                <AlertCircle size={20} className="text-[#1BAC4B]" /> High Priority Alerts
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5">
                                    <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center shrink-0 font-black">!</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Connector A1 Overheating</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status check required immediately</p>
                                    </div>
                                    <span className="ml-auto text-[10px] font-bold text-slate-600">2m ago</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 mb-8">Station Overview</h3>
                            <div className="space-y-8">
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><MapPin size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">HUB ADDRESS</p>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{assignedStation.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><Clock size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ACTIVE SHIFT</p>
                                        <p className="text-sm font-bold text-slate-700">{assignedStation.operatingHours || '24 / 7 Shift'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-50 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                                    <span className="text-xs font-black text-[#1BAC4B]">98.4%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-[#1BAC4B] h-full w-[98.4%] rounded-full shadow-lg shadow-green-100" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1BAC4B] rounded-[3rem] p-10 shadow-xl shadow-green-100 group hover:scale-[1.02] transition-all cursor-pointer">
                            <h3 className="text-xl font-black text-white mb-8">Shift Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                                    <p className="text-2xl font-black text-white">42</p>
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.15em] mt-1">Sessions</p>
                                </div>
                                <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                                    <p className="text-2xl font-black text-white">₹3.2k</p>
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.15em] mt-1">Revenue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default OperatorDashboard;
