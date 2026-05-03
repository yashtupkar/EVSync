import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddStationForm from '../components/AddStationForm';
import { Zap, ArrowLeft, Info } from 'lucide-react';

const AddStationPage = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        // After successful addition, go to dashboard where they can see the status
        navigate('/owner-dashboard');
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-[#F8FAF9] pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4 mb-4">
                        <button 
                            onClick={handleCancel}
                            className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-green-100">
                            <Zap className="text-white w-6 h-6 fill-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Register Your <span className="text-emerald-500">Charging Station</span>
                        </h1>
                    </div>
                    
                    <div className="bg-white border border-emerald-100 p-6 rounded-3xl flex items-start gap-4 shadow-sm max-w-3xl">
                        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500 shrink-0">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">Welcome to the Network!</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Join India's fastest-growing EV charging network. Provide your station details below to start receiving bookings. Our team will review your application within 24-48 hours.
                            </p>
                        </div>
                    </div>
                </div>

                {/* The Form Component */}
                <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <AddStationForm onCancel={handleCancel} onSuccess={handleSuccess} />
                </div>
            </div>
            
            {/* Background Decorations */}
            <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-green-50/50 to-transparent -z-10 blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-green-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />
        </div>
    );
};

export default AddStationPage;
