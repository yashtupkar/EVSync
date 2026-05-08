import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { socket } from '../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, X, User, AlertTriangle, Clock, Radio, Navigation } from 'lucide-react';

const EmergencyAlertListener = () => {
    const user = useSelector(state => state.auth?.user);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        if (!user || !socket) return;

        const handleEmergencyAlert = (data) => {
            // Check if user should receive this alert
            const isAdmin = user.role === 'Admin';
            const isTargetOwner = data.alertedOwnerIds?.includes(user._id);
            const isTargetOperator = data.alertedOperatorIds?.includes(user._id);

            if (isAdmin || isTargetOwner || isTargetOperator) {
                setAlert(data);

                // Play a loud beep to grab attention
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
                    osc.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.5); // Beep for half a second
                } catch (e) {
                    console.error("Audio block", e);
                }
            }
        };

        socket.on('emergency-alert', handleEmergencyAlert);

        return () => {
            socket.off('emergency-alert', handleEmergencyAlert);
        };
    }, [user]);

    if (!alert) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden relative"
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setAlert(null)}
                        className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors z-10"
                    >
                        <X size={16} />
                    </button>

                    <div className="p-6">
                        {/* Top Icon & Title */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                                <div className="absolute inset-0 border border-red-100 rounded-full animate-ping opacity-75"></div>
                                <div className="absolute inset-2 border border-red-200 rounded-full"></div>
                                <div className="absolute inset-4 border border-red-100 rounded-full"></div>
                                <div className="relative w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm">
                                    <ShieldAlert size={28} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-red-600 mb-2">
                                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M0 10h10l3-7 6 14 4-10 3 3h14" />
                                </svg>
                                <h2 className="text-2xl font-black tracking-widest uppercase">SOS Alert</h2>
                                <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M0 10h14l3-3 4 10 6-14 3 7h10" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-500">A nearby EV driver has requested immediate assistance.</p>
                        </div>

                        {/* Red tinted Driver Details Section */}
                        <div className="bg-red-50/50 rounded-2xl p-4 space-y-4 mb-4 border border-red-100">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Driver Name</p>
                                    <p className="font-bold text-slate-800">{alert.userName || 'Unknown Driver'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Emergency Type</p>
                                    <p className="font-bold text-red-600">{alert.emergencyType}</p>
                                </div>
                            </div>
                        </div>

                        {/* Grid Details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-2 py-4 border-b border-slate-100 mb-4">
                            {/* Time */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested At</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                    <p className="text-sm font-bold text-slate-800 line-clamp-1">Live Coordinates</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[120px]">
                                        {alert.userLat ? `${Number(alert.userLat).toFixed(4)}, ${Number(alert.userLng).toFixed(4)}` : "Tracking link available"}
                                    </p>
                                </div>
                            </div>

                            {/* Distance */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                                    <Navigation size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                                    <p className="text-sm font-bold text-slate-800">{'< 10 km'}</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">from your station</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                    <Radio size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-bold text-red-500">Active</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Awaiting response</p>
                                </div>
                            </div>
                        </div>

                        {/* Yellow Warning Banner */}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3 items-center mb-6">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <ShieldAlert size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Quick response can save lives.</p>
                                <p className="text-xs text-slate-600 mt-0.5">Please act immediately.</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAlert(null)}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={16} /> Dismiss
                            </button>
                            <a
                                href={alert.userLat ? `https://www.google.com/maps?q=${alert.userLat},${alert.userLng}` : alert.locationMessage}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setAlert(null)}
                                className="flex-[1.5] py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                            >
                                <MapPin size={16} /> View Live Location
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmergencyAlertListener;
