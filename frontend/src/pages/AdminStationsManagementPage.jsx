import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectToken } from '../features/auth/authSelectors';
import { getAllStationRequests, createAdminStation, updateAdminStation, deleteAdminStation } from '../api/stationApi';
import AddStationForm from '../components/AddStationForm';
import { adminSidebarItems } from '../config/adminSidebar';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    Zap, Search, Plus, MapPin, CheckCircle2, XCircle, Clock,
    MoreVertical, Edit3, Trash2, ShieldCheck, Filter, UserPlus, X
} from 'lucide-react';
import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL;


const AdminStationsManagementPage = () => {
    const token = useSelector(selectToken);
    const location = useLocation();
    
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningStationId, setAssigningStationId] = useState(null);
    const [operatorData, setOperatorData] = useState({ name: '', email: '' });
    const [assigning, setAssigning] = useState(false);


    useEffect(() => {
        fetchStations();
    }, [token]);

    const fetchStations = async () => {
        try {
            setLoading(true);
            const res = await getAllStationRequests(token);
            if (res.data.success) {
                setStations(res.data.stations);
            }
        } catch (error) {
            toast.error("Failed to load stations");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddForm = () => {
        setEditingStation(null);
        setShowForm(true);
    };

    const handleOpenEditForm = (station) => {
        setEditingStation(station);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingStation(null);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingStation) {
                const res = await updateAdminStation(editingStation._id, formData, token);
                if (res.data.success) {
                    toast.success("Station updated successfully!");
                }
            } else {
                const res = await createAdminStation(formData, token);
                if (res.data.success) {
                    toast.success("Station created successfully!");
                }
            }
            handleCloseForm();
            fetchStations();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save station");
        }
    };

    const handleDeleteStation = async (id) => {
        if (!window.confirm("Are you sure you want to delete this station?")) return;
        try {
            const res = await deleteAdminStation(id, token);
            if (res.data.success) {
                toast.success("Station deleted");
                fetchStations();
            }
        } catch (error) {
            toast.error("Failed to delete station");
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
            const res = await axios.post(`${backendURL}/api/admin/assign-operator`, {
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


    const filteredStations = stations.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.chargerId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch(status) {
            case 'approved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-amber-100 text-amber-600 border-amber-200';
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'approved': return <CheckCircle2 size={12} />;
            case 'rejected': return <XCircle size={12} />;
            default: return <Clock size={12} />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <header className="  mb-5 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Stations Management</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Manage and edit all charging stations across the network.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleOpenAddForm}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} /> Add New Station
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto ">
                    <div className="max-w-[1400px] mx-auto">
                        
                        {/* Filters & Search */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
                            <div className="relative w-96">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search stations by name, ID or address..." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                <Filter size={16} /> Filters
                            </button>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-slate-400 font-bold">Loading stations...</div>
                            ) : filteredStations.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Zap size={48} className="mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-800">No stations found</h3>
                                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search filters.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Station Details</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargers</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStations.map(station => (
                                            <tr key={station._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                            {station.images?.[0] ? (
                                                                <img src={station.images[0]} alt="Station" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Zap size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{station.name}</h4>
                                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{station.stationType}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-xs font-bold text-slate-700">{station.chargers?.length || 0} Connectors</span>
                                                        <div className="flex gap-1.5">
                                                            {station.chargers?.slice(0,3).map((c, i) => (
                                                                <span key={i} className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase">{c.type}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                                        <span className="text-xs text-slate-500 font-medium line-clamp-2 max-w-[200px]">{station.address}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(station.status)}`}>
                                                        {getStatusIcon(station.status)}
                                                        {station.status}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleOpenEditForm(station)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        {station.stationType === 'manned' && (
                                                            <button 
                                                                onClick={() => {
                                                                    setAssigningStationId(station._id);
                                                                    setShowAssignModal(true);
                                                                }}
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Assign Operator"
                                                            >
                                                                <UserPlus size={16} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDeleteStation(station._id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Form Overlay */}
                {showForm && (
                    <AddStationForm 
                        onCancel={handleCloseForm} 
                        initialData={editingStation}
                        isAdmin={true}
                        isEditMode={!!editingStation}
                        onSubmitOverride={handleFormSubmit}
                    />
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
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        {assigning ? <RefreshCcw size={16} className="animate-spin" /> : 'Confirm Assignment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>

    );
};

export default AdminStationsManagementPage;
