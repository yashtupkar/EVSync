import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../features/auth/authSelectors';
import { logout } from '../features/auth/authSlice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {Outlet} from 'react-router-dom';
import { 
    Zap, LogOut, Bell, Search, Menu, X, 
    User, Settings, HelpCircle, ChevronRight,
    Calendar, PlusCircle, LayoutDashboard,
    PieChart, BarChart3, MessageSquare, ClipboardList,
    DollarSign, Monitor, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardLayout = ({ 
    children, 
    sidebarItems = [], 
    theme = 'green', 
    roleName = 'User' 
}) => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const handleLogout = () => {
        dispatch(logout());
        toast.success("Logged out successfully");
        navigate('/login');
    };

    const themeConfig = {
        green: {
            accent: '#10b981', // emerald-500
            bg: 'bg-emerald-500',
            lightBg: 'bg-emerald-50',
            text: 'text-emerald-500'
        },
        indigo: {
            accent: '#4f46e5',
            bg: 'bg-indigo-600',
            lightBg: 'bg-indigo-50',
            text: 'text-indigo-600'
        },
        slate: {
            accent: '#0f172a',
            bg: 'bg-slate-900',
            lightBg: 'bg-slate-50',
            text: 'text-slate-900'
        },
    };

    const config = themeConfig[theme] || themeConfig.green;
    const brandConfig = {
        'Global Administrator': {
            title: 'Admin',
            accent: 'Hub',
            subtitle: 'EV Charging Admin'
        },
        'On-Site Operator': {
            title: 'Operator',
            accent: 'Hub',
            subtitle: 'Charging Operations'
        },
        'Station Owner': {
            title: 'Partner',
            accent: 'Hub',
            subtitle: 'EV Charging Partner'
        }
    };
    const brand = brandConfig[roleName] || {
        title: 'Partner',
        accent: 'Hub',
        subtitle: roleName
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-slate-900">
            {/* --- SIDEBAR --- */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-100 flex flex-col transition-all duration-300 fixed h-full z-[100]`}>
                {/* Logo Section */}
                <div className="p-6 mb-2">
                    <Link to="/" className="flex items-center gap-3">
                        <div className={`${config.bg} w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0`}>
                            <Zap className="text-white w-6 h-6 fill-white" />
                        </div>
                        {isSidebarOpen && (
                            <div className="animate-in fade-in duration-500">
                                <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">
                                    {brand.title}<span className={config.text}>{brand.accent}</span>
                                </h1>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{brand.subtitle}</p>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-grow px-3 space-y-1 overflow-y-auto no-scrollbar">
                    {sidebarItems.map((item, index) => {
                        const isActive = location.pathname === item.path || item.isActive;
                        return (
                            <button
                                key={index}
                                onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] transition-all group relative ${isActive ? `${config.bg} text-white shadow-lg ${theme === 'green' ? 'shadow-emerald-100' : 'shadow-indigo-100'}` : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                                {isSidebarOpen && <span className="animate-in slide-in-from-left-2">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                {isSidebarOpen && (
                    <div className="px-4 mb-6">
                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-50 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-1">Grow Your Business</h4>
                                <p className="text-[10px] text-emerald-600/80 font-medium leading-relaxed mb-4">Add more stations and increase your earnings.</p>
                                <button className="w-full bg-emerald-500 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                                    <PlusCircle size={14} /> Register New Station
                                </button>
                            </div>
                            {/* Decorative Illustration */}
                            <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-20 transition-all">
                                <Zap size={60} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-slate-50 mt-auto">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-2">
                            <div className={`${config.bg} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg uppercase shadow-sm shrink-0 overflow-hidden`}>
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user?.name || 'User'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user?.name?.[0] || 'D'
                                )}
                            </div>
                            {isSidebarOpen && (
                                <div className="overflow-hidden">
                                    <p className="font-bold text-slate-800 text-sm truncate">{user?.name || 'Devplex'}</p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                        Approved Partner <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"><CheckCircle size={6} className="text-white" /></div>
                                    </p>
                                </div>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-100 text-slate-500 font-bold text-[11px] hover:bg-slate-50 hover:text-red-500 transition-all"
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Top Navbar */}
                <header className="h-[70px] bg-white border-b border-slate-100 sticky top-0 z-[90] flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                        >
                            {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight ml-2">
                            Welcome back, <span className="text-emerald-500">{user?.name || 'Devplex'}!</span> 👋
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-3 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-100 transition-all">
                            <Calendar size={14} />
                            May 18 - May 24, 2025
                            <ChevronRight size={14} className="rotate-90" />
                        </div>
                        <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all relative">
                            <Bell size={18} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">3</span>
                        </button>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-100 shadow-sm shrink-0">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user?.name || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className={`${config.bg} w-full h-full flex items-center justify-center text-white font-bold text-sm uppercase`}>
                                    {user?.name?.[0] || 'D'}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-8">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
};

// Simple icon wrapper for the checkmark
const CheckCircle = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default DashboardLayout;
