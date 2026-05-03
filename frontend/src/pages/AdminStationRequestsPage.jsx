import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    Search,
    Shield,
    Users,
    XCircle,
    Zap,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Info,
    Calendar,
    LayoutGrid,
    Navigation,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Wifi,
    ParkingCircle,
    Coffee,
    Lock,
    ShoppingBag,
    Wind,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

import DashboardLayout from '../layouts/DashboardLayout';
import {
    approveStationRequest,
    getAllStationRequests,
    rejectStationRequest,
} from '../api/stationApi';
import { selectToken } from '../features/auth/authSelectors';
import { adminSidebarItems } from '../config/adminSidebar';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const AdminStationRequestsPage = () => {
    const token = useSelector(selectToken);
    const [allStations, setAllStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
    const [selectedStationId, setSelectedStationId] = useState('');
    const [processingId, setProcessingId] = useState('');
    const [rejectionReasons, setRejectionReasons] = useState({});

    const [mapStyle] = useState(localStorage.getItem("evsync_map_style") || "default");
    const mapStyles = {
        default: {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
        streets: {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
        modern: {
            url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        },
        terrain: {
            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        },
        dark: {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
        night: {
            url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
        retro: {
            url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
        },
    };

    useEffect(() => {
        if (token) {
            fetchStations();
        }
    }, [token]);

    const fetchStations = async () => {
        setLoading(true);
        try {
            const response = await getAllStationRequests(token);
            const stations = response.data?.stations || [];
            setAllStations(stations);
            
            // Set first station as selected if none selected
            if (stations.length > 0 && !selectedStationId) {
                const pending = stations.filter(s => s.status === 'pending');
                if (pending.length > 0) {
                    setSelectedStationId(pending[0]._id);
                } else {
                    setSelectedStationId(stations[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching station requests:', error);
            toast.error(error.response?.data?.message || 'Failed to load station requests');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        return {
            total: allStations.length,
            pending: allStations.filter(s => s.status === 'pending').length,
            approved: allStations.filter(s => s.status === 'approved').length,
            rejected: allStations.filter(s => s.status === 'rejected').length,
        };
    }, [allStations]);

    const filteredStations = useMemo(() => {
        const normalizedQuery = searchTerm.trim().toLowerCase();
        
        // First filter by tab
        let result = allStations.filter(s => s.status === activeTab);

        if (!normalizedQuery) {
            return result;
        }

        return result.filter((station) => {
            const ownerName = station.ownerId?.name || '';
            const ownerEmail = station.ownerId?.email || '';

            return [station.name, station.address, ownerName, ownerEmail]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [allStations, searchTerm, activeTab]);

    const selectedStation = allStations.find((station) => station._id === selectedStationId) || null;

    const handleApprove = async (stationId) => {
        try {
            setProcessingId(stationId);
            await approveStationRequest(stationId, token);
            toast.success('Station request approved');
            await fetchStations();
        } catch (error) {
            console.error('Error approving station:', error);
            toast.error(error.response?.data?.message || 'Failed to approve station');
        } finally {
            setProcessingId('');
        }
    };

    const handleReject = async (stationId) => {
        const reason = rejectionReasons[stationId]?.trim();

        if (!reason) {
            toast.error('Please enter a rejection reason');
            return;
        }

        try {
            setProcessingId(stationId);
            await rejectStationRequest(stationId, reason, token);
            setRejectionReasons((current) => ({ ...current, [stationId]: '' }));
            toast.success('Station request rejected');
            await fetchStations();
        } catch (error) {
            console.error('Error rejecting station:', error);
            toast.error(error.response?.data?.message || 'Failed to reject station');
        } finally {
            setProcessingId('');
        }
    };

    return (
            <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
                {/* Stats Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        icon={<LayoutGrid size={24} className="text-indigo-600" />}
                        label="TOTAL REQUESTS" 
                        value={stats.total} 
                        subLabel="All time"
                        color="bg-indigo-50"
                    />
                    <StatCard 
                        icon={<Clock3 size={24} className="text-yellow-600" />}
                        label="PENDING" 
                        value={stats.pending} 
                        subLabel="Awaiting review"
                        color="bg-yellow-50"
                    />
                    <StatCard 
                        icon={<CheckCircle2 size={24} className="text-emerald-600" />}
                        label="APPROVED" 
                        value={stats.approved} 
                        subLabel="This month"
                        color="bg-emerald-50"
                    />
                    <StatCard 
                        icon={<XCircle size={24} className="text-red-600" />}
                        label="REJECTED" 
                        value={stats.rejected} 
                        subLabel="This month"
                        color="bg-red-50"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* Sidebar List */}
                    <aside className="xl:col-span-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[850px]">
                        <div className="p-4 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-800">Request List</h2>
                                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filteredStations.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        placeholder="Search by station or owner..."
                                    />
                                </div>
                                <button className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-all">
                                    <Filter size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-1 border-b border-slate-100 pb-1">
                                <TabButton 
                                    active={activeTab === 'pending'} 
                                    onClick={() => setActiveTab('pending')}
                                    label={`Pending (${stats.pending})`}
                                />
                                <TabButton 
                                    active={activeTab === 'approved'} 
                                    onClick={() => setActiveTab('approved')}
                                    label={`Approved (${stats.approved})`}
                                />
                                <TabButton 
                                    active={activeTab === 'rejected'} 
                                    onClick={() => setActiveTab('rejected')}
                                    label={`Rejected (${stats.rejected})`}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p className="font-bold">Loading requests...</p>
                                </div>
                            ) : filteredStations.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-slate-500 font-bold">No requests found</p>
                                    <p className="text-slate-400 text-sm mt-1">Try a different tab or search term</p>
                                </div>
                            ) : (
                                filteredStations.map((station) => (
                                    <StationListItem 
                                        key={station._id}
                                        station={station}
                                        selected={selectedStationId === station._id}
                                        onClick={() => setSelectedStationId(station._id)}
                                    />
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                <span>Showing {filteredStations.length} of {allStations.filter(s => s.status === activeTab).length} requests</span>
                                <div className="flex gap-1">
                                    <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white">1</button>
                                    <button className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">2</button>
                                    <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Detail Panel */}
                    <main className="xl:col-span-8 bg-white rounded-xl border border-slate-100 shadow-sm min-h-[850px] flex flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!selectedStation ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col items-center justify-center p-20 text-center"
                                >
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-200">
                                        <Shield size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800">Select a request</h3>
                                    <p className="text-slate-400 mt-2 max-w-sm">Choose a station request from the list to view full details and take action.</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key={selectedStation._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar"
                                >
                                    {/* Panel Header */}
                                    <header className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-3xl font-black text-slate-900">{selectedStation.name}</h2>
                                                <StatusBadge status={selectedStation.status} />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                                                <span className="font-bold text-slate-500">Request ID: <span className="text-slate-400 font-medium">{selectedStation._id}</span></span>
                                                <span className="font-bold text-slate-500">Submitted on <span className="text-slate-400 font-medium">{new Date(selectedStation.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {selectedStation.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleApprove(selectedStation._id)}
                                                        disabled={processingId === selectedStation._id}
                                                        className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                                    >
                                                        {processingId === selectedStation._id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(selectedStation._id)}
                                                        disabled={processingId === selectedStation._id}
                                                        className="px-6 py-3 rounded-2xl border-2 border-red-100 text-red-500 font-black flex items-center gap-2 hover:bg-red-50 transition-all disabled:opacity-50"
                                                    >
                                                        {processingId === selectedStation._id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-3 rounded-2xl border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all">
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    </header>

                                    <div className="p-8 space-y-10">
                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <InfoCard icon={<Users size={18} />} label="OWNER" value={selectedStation.ownerId?.name || 'Devplex'} />
                                            <InfoCard icon={<Mail size={18} />} label="EMAIL" value={selectedStation.ownerId?.email || 'dev@example.com'} />
                                            <InfoCard icon={<Phone size={18} />} label="PHONE" value={selectedStation.ownerId?.mobile || '+91 00000 00000'} />
                                            <InfoCard icon={<Zap size={18} />} label="STATION TYPE" value={selectedStation.stationType || 'Unmanned'} capitalize />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="lg:col-span-2">
                                                <InfoCard icon={<MapPin size={18} />} label="ADDRESS" value={selectedStation.address} />
                                            </div>
                                            <InfoCard icon={<LayoutGrid size={18} />} label="TOTAL CHARGERS" value={`${selectedStation.chargers?.length || 0} Configured`} />
                                            <InfoCard icon={<Clock3 size={18} />} label="OPERATING HOURS" value={selectedStation.operatingHours || '06:00 AM - 11:00 PM'} />
                                        </div>

                                        {/* Station Images */}
                                        {selectedStation.images?.length > 0 && (
                                            <section className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon size={20} className="text-slate-400" />
                                                    <h3 className="text-lg font-black text-slate-800">Station Images</h3>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {selectedStation.images.map((img, idx) => (
                                                        <div key={idx} className="aspect-video rounded-3xl overflow-hidden bg-slate-100 group relative">
                                                            <img src={img} alt={`Station ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
                                                                    <ImageIcon size={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Map Location */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Navigation size={20} className="text-slate-400" />
                                                <h3 className="text-lg font-black text-slate-800">Location on Map</h3>
                                            </div>
                                            <div className="h-[300px] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm z-0">
                                                <MapContainer 
                                                    center={[selectedStation.location?.coordinates[1] || 23.2599, selectedStation.location?.coordinates[0] || 77.4126]} 
                                                    zoom={15} 
                                                    scrollWheelZoom={false}
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer 
                                                        url={mapStyles[mapStyle]?.url || mapStyles.default.url} 
                                                        attribution={mapStyles[mapStyle]?.attribution || mapStyles.default.attribution}
                                                    />
                                                    <Marker position={[selectedStation.location?.coordinates[1] || 23.2599, selectedStation.location?.coordinates[0] || 77.4126]}>
                                                        <Popup>{selectedStation.name}</Popup>
                                                    </Marker>
                                                    <MapUpdater center={[selectedStation.location?.coordinates[1] || 23.2599, selectedStation.location?.coordinates[0] || 77.4126]} />
                                                </MapContainer>
                                            </div>
                                        </section>

                                        {/* Charger Details */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Zap size={20} className="text-slate-400" />
                                                <h3 className="text-lg font-black text-slate-800">Charger Details</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedStation.chargers?.map((charger, idx) => (
                                                    <ChargerCard key={idx} charger={charger} />
                                                )) || (
                                                    <p className="text-slate-400 font-bold italic">No chargers configured</p>
                                                )}
                                            </div>
                                        </section>

                                        {/* Amenities */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Info size={20} className="text-slate-400" />
                                                <h3 className="text-lg font-black text-slate-800">Amenities</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {selectedStation.amenities?.map((amenity, idx) => (
                                                    <AmenityTag key={idx} name={amenity} />
                                                )) || (
                                                    <p className="text-slate-400 font-bold italic">No amenities listed</p>
                                                )}
                                            </div>
                                        </section>

                                        {/* Admin Notes */}
                                        <section className="space-y-4 pb-10">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={20} className="text-slate-400" />
                                                <h3 className="text-lg font-black text-slate-800">Admin Notes <span className="text-slate-400 font-medium text-sm ml-1">(Optional)</span></h3>
                                            </div>
                                            <div className="relative">
                                                <textarea 
                                                    value={rejectionReasons[selectedStation._id] || ''}
                                                    onChange={(e) => setRejectionReasons(prev => ({ ...prev, [selectedStation._id]: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/10 transition-all min-h-[120px] resize-none"
                                                    placeholder="Write a reason if you want to reject this request..."
                                                    maxLength={250}
                                                />
                                                <span className="absolute bottom-6 right-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {(rejectionReasons[selectedStation._id] || '').length}/250
                                                </span>
                                            </div>
                                        </section>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
    );
};

// Sub-components
const StatCard = ({ icon, label, value, subLabel, color }) => (
    <div className={`p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group`}>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{value}</span>
                <span className="text-[10px] font-bold text-slate-400">{subLabel}</span>
            </div>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all relative ${
            active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
        }`}
    >
        {label}
        {active && (
            <motion.div 
                layoutId="activeTab"
                className="absolute bottom-[-5px] left-0 right-0 h-1 bg-indigo-600 rounded-full"
            />
        )}
    </button>
);

const StationListItem = ({ station, selected, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
            selected 
                ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-200' 
                : 'bg-white border-slate-100 hover:border-slate-200'
        }`}
    >
        <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
                {station.images?.[0] ? (
                    <img src={station.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={24} />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-black text-slate-800 text-sm truncate">{station.name}</h4>
                    <StatusBadge status={station.status} small />
                </div>
                <div className="flex items-center gap-1 text-slate-400 mb-2">
                    <Users size={12} className="flex-shrink-0" />
                    <span className="text-[10px] font-bold truncate">{station.ownerId?.name || 'Owner'}</span>
                    <span className="mx-1">•</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(station.createdAt).getHours()}h ago</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate mb-3 flex items-center gap-1">
                    <MapPin size={10} /> {station.address}
                </p>
                <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase">
                        {station.chargers?.length || 0} Chargers
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase">
                        {station.stationType || 'Unmanned'}
                    </span>
                </div>
            </div>
        </div>
        {selected && (
            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-20 bg-indigo-600 rounded-l-full" />
        )}
    </button>
);

const StatusBadge = ({ status, small = false }) => {
    const configs = {
        pending: { label: 'PENDING REVIEW', color: 'bg-orange-50 text-orange-600 border-orange-100' },
        approved: { label: 'APPROVED', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        rejected: { label: 'REJECTED', color: 'bg-red-50 text-red-600 border-red-100' },
    };
    const config = configs[status] || configs.pending;

    return (
        <span className={`${config.color} border ${small ? 'px-1.5 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'} font-black rounded-full tracking-wider uppercase`}>
            {config.label}
        </span>
    );
};

const InfoCard = ({ icon, label, value, capitalize = false }) => (
    <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 space-y-2 group hover:bg-white hover:border-indigo-100 transition-all">
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-400 transition-colors">
            {icon}
            <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
        </div>
        <p className={`text-sm font-black text-slate-700 truncate ${capitalize ? 'capitalize' : ''}`}>{value || 'Not provided'}</p>
    </div>
);

const ChargerCard = ({ charger }) => {
    const isAC = charger.type?.toLowerCase().includes('ac');
    const colorClass = isAC ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100';
    const iconColor = isAC ? 'text-emerald-500' : 'text-indigo-500';

    return (
        <div className="p-5 rounded-[2rem] border border-slate-100 bg-white flex items-center justify-between group hover:border-indigo-100 transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center`}>
                    <Zap size={20} />
                </div>
                <div>
                    <h5 className="font-black text-slate-800">{charger.chargerId || 'DC-01'}</h5>
                    <p className="text-xs font-bold text-slate-400">{charger.type} • {isAC ? 'AC' : 'DC Fast'}</p>
                </div>
            </div>
            <div className="text-right">
                <span className={`text-sm font-black ${iconColor}`}>{charger.power} kW</span>
                <p className="text-[10px] font-bold text-slate-400 mt-1">AVAILABLE</p>
            </div>
        </div>
    );
};

const AmenityTag = ({ name }) => {
    const icons = {
        parking: <ParkingCircle size={14} />,
        washroom: <Wind size={14} />,
        cafe: <Coffee size={14} />,
        security: <Lock size={14} />,
        shop: <ShoppingBag size={14} />,
        wifi: <Wifi size={14} />,
        '24x7': <Calendar size={14} />,
    };

    const lowerName = name.toLowerCase();
    let icon = icons.parking; // default
    if (lowerName.includes('washroom') || lowerName.includes('toilet')) icon = icons.washroom;
    else if (lowerName.includes('cafe') || lowerName.includes('food')) icon = icons.cafe;
    else if (lowerName.includes('security') || lowerName.includes('cctv')) icon = icons.security;
    else if (lowerName.includes('shop') || lowerName.includes('store')) icon = icons.shop;
    else if (lowerName.includes('wifi')) icon = icons.wifi;
    else if (lowerName.includes('24')) icon = icons['24x7'];

    return (
        <span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-100 text-slate-600 text-xs font-bold hover:border-indigo-100 hover:text-indigo-600 transition-all cursor-default">
            {icon}
            {name}
        </span>
    );
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 15);
    }, [center, map]);
    return null;
};

export default AdminStationRequestsPage;
