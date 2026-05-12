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
    DollarSign, Monitor, Wallet, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmergencyAlertListener from '../components/EmergencyAlertListener';
import QRScannerModal from '../components/QRScannerModal';

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
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 1024);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        toast.success("Logged out successfully");
        navigate('/login');
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

    const themeConfig = {
        green: {
            accent: '#10b981', // emerald-500
            bg: 'bg-emerald-500',
            lightBg: 'bg-emerald-50',
            text: 'text-emerald-500'
        },
      
    };

    const config = themeConfig.green;
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
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-slate-900 overflow-x-hidden">
            <EmergencyAlertListener />

            {/* --- MOBILE BACKDROP --- */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[95] lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside className={`
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                ${isSidebarOpen ? 'w-64' : 'lg:w-20'} 
                bg-white border-r border-slate-100 flex flex-col transition-all duration-300 fixed h-full z-[100]
            `}>
                {/* Logo Section */}
                <div className="p-6 mb-2 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className={`${config.bg} w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0`}>
                            <Zap className="text-white w-6 h-6 fill-white" />
                        </div>
                        {(isSidebarOpen || window.innerWidth < 1024) && (
                            <div className="animate-in fade-in duration-500">
                                <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">
                                    {brand.title}<span className={config.text}>{brand.accent}</span>
                                </h1>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{brand.subtitle}</p>
                            </div>
                        )}
                    </Link>
                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
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
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                        Approved Partner <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"><CheckCircle size={6} className="text-white" /></div>
                                    </div>

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
            <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0`}>
                {/* Top Navbar */}
                <header className="h-[70px] bg-white border-b border-slate-100 sticky top-0 z-[90] flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-sm md:text-xl font-black text-slate-800 tracking-tight ml-1 md:ml-2 line-clamp-1">
                            Welcome back, <span className="text-emerald-500">{user?.name?.split(' ')[0] || 'User'}!</span> 👋
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden sm:flex bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl items-center gap-3 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-100 transition-all">
                            <Calendar size={14} />
                            May 18 - 24
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
                <main className="p-4 md:p-8 pb-24 lg:pb-8">
                    <Outlet/>
                </main>

                {/* --- BOTTOM NAVIGATION (MOBILE) --- */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-3 z-[90] flex items-center justify-around shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                    {(() => {
                        const baseItems = sidebarItems.slice(0, 4);
                        const isOperator = roleName === 'On-Site Operator';
                        
                        let displayItems = [];
                        if (isOperator) {
                            // Inject Scanner in the middle
                            displayItems = [
                                ...baseItems.slice(0, 2),
                                { label: 'Scan', icon: QrCode, isScanner: true, onClick: () => setIsScannerOpen(true) },
                                ...baseItems.slice(2, 4)
                            ];
                        } else {
                            displayItems = [
                                ...baseItems,
                                { label: 'More', icon: MoreVerticalIcon, onClick: () => setIsSidebarOpen(true) }
                            ];
                        }

                        return displayItems.map((item, index) => {
                            const isActive = location.pathname === item.path || item.isActive;
                            
                            if (item.isScanner) {
                                return (
                                    <button
                                        key="scanner"
                                        onClick={item.onClick}
                                        className="relative -top-4 flex flex-col items-center gap-1 group"
                                    >
                                        <div className={`${config.bg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100 group-active:scale-90 transition-all`}>
                                            <QrCode size={24} className="text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest mt-1">Scan</span>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                                    className={`flex flex-col items-center gap-1 transition-all ${isActive ? config.text : 'text-slate-400'}`}
                                >
                                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? `${config.lightBg}` : ''}`}>
                                        <item.icon size={20} className={isActive ? config.text : 'text-slate-400'} />
                                    </div>
                                    <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                                </button>
                            );
                        });
                    })()}
                </div>

                <QRScannerModal 
                    isOpen={isScannerOpen} 
                    onClose={() => setIsScannerOpen(false)} 
                    onScanSuccess={handleScanSuccess} 
                />
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

const MoreVerticalIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
);

export default DashboardLayout;
