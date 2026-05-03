import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../features/auth/authSelectors';
import { Clock, CheckCircle, XCircle, Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import AddStationForm from './AddStationForm';

const PendingApprovalPage = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        if (user && user.role === 'station_owner' && user.status === 'approved') {
            navigate('/owner-dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleLogout = () => {
        dispatch(logout());
    };

    if (showAddForm) {
        return <AddStationForm onCancel={() => setShowAddForm(false)} />;
    }

    return (
        <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-6 pt-32">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-gray-100 text-center relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-bl-[5rem] -z-0" />
                
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-yellow-50 rounded-3xl flex items-center justify-center text-yellow-500 mx-auto mb-8 shadow-inner">
                        <Clock size={48} className="animate-pulse" />
                    </div>

                    <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">
                        Account <span className="text-yellow-500">Pending</span> Approval
                    </h1>
                    
                    <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-md mx-auto">
                        Welcome, <span className="text-slate-800 font-bold">{user?.name || 'Partner'}</span>! Your station owner account is currently being reviewed by our team.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={18} /></div>
                                <h3 className="font-bold text-slate-800">Verification Steps</h3>
                            </div>
                            <ul className="text-sm text-slate-500 space-y-2 font-medium">
                                <li>• Profile Information Review</li>
                                <li>• Identity Check</li>
                                <li className="text-yellow-600 font-bold">• Station Request Submission</li>
                            </ul>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><LayoutDashboard size={18} /></div>
                                <h3 className="font-bold text-slate-800">Why Pending?</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                To access the full dashboard, you must submit your first station for review.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center justify-center gap-3 bg-[#1BAC4B] text-white px-8 py-5 rounded-2xl font-bold hover:bg-[#189a43] transition-all shadow-xl shadow-green-100 active:scale-95"
                        >
                            <Plus size={20} /> Register Your Station
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-3 bg-white text-slate-600 border border-slate-200 px-8 py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <LogOut size={20} /> Sign Out
                        </button>
                    </div>

                    <p className="mt-12 text-sm text-slate-400 font-medium italic">
                        Questions? Contact support at <span className="text-[#1BAC4B] font-bold">partners@evsync.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalPage;
