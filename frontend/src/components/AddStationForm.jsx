import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectToken } from '../features/auth/authSelectors';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    X, MapPin, Zap, Info, CreditCard, Image as ImageIcon, 
    Wifi, Coffee, Utensils, Shield, Clock, Phone, Navigation,
    Check, Plus, ArrowLeft, Trash2, Upload, Edit3, Eye, Loader
} from 'lucide-react';
import { uploadStationImage } from '../api/stationApi';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const backendURL = import.meta.env.VITE_BACKEND_URL;

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) });
        },
    });
    return position.lat && position.lng ? <Marker position={[position.lat, position.lng]} /> : null;
};

const RecenterMap = ({ lat, lng }) => {
    const map = useMapEvents({});
    React.useEffect(() => {
        if (lat && lng) map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const SectionCard = ({ icon, title, children, extra }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="text-[#1BAC4B]">{icon}</div>
                <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            </div>
            {extra}
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const AddStationForm = ({ onCancel, onSuccess, initialData = null, isAdmin = false, isEditMode = false, onSubmitOverride }) => {
    const token = useSelector(selectToken);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const normalizeInitialData = (data) => {
        if (!data) return null;
        
        const normalized = { ...data };
        
        // Normalize location (GeoJSON -> {lat, lng})
        if (data.location && data.location.coordinates) {
            normalized.location = {
                lat: data.location.coordinates[1],
                lng: data.location.coordinates[0]
            };
        } else if (data.location && data.location.lat !== undefined) {
            normalized.location = data.location;
        } else {
            normalized.location = { lat: 23.2599, lng: 77.4126 };
        }

        // Normalize operatingHours (String -> {from, to})
        if (typeof data.operatingHours === 'string') {
            const [from, to] = data.operatingHours.split(' - ');
            normalized.operatingHours = { 
                from: from || '06:00 AM', 
                to: to || '11:00 PM' 
            };
        } else if (!data.operatingHours) {
            normalized.operatingHours = { from: '06:00 AM', to: '11:00 PM' };
        }

        return normalized;
    };

    const [formData, setFormData] = useState(normalizeInitialData(initialData) || {
        name: '',
        description: '',
        address: '',
        location: { lat: 23.2599, lng: 77.4126 },
        stationType: 'manned',
        contactNumber: '',
        email: '',
        gstNo: '',
        operatorName: '',
        operatingHours: { from: '06:00 AM', to: '11:00 PM' },
        amenities: ['parking', 'washroom', 'cafe', 'security', '24x7'],
        chargers: [
            { chargerId: 'DC-01', type: 'CCS2', power: 60, totalSlots: 1, pricePerUnit: 18.00, pricePerMinute: 0 }
        ],
        images: [],
        additionalNotes: ''
    });

    // -------------------------------
    // 🔥 Logic
    // -------------------------------
    const isDC = (type) => ['CCS2', 'CHAdeMO'].includes(type);

    const reindexChargers = (chargers) => {
        let dcCount = 0;
        let acCount = 0;
        return chargers.map(c => {
            if (isDC(c.type)) {
                dcCount++;
                return { ...c, chargerId: `DC-${String(dcCount).padStart(2, '0')}` };
            } else {
                acCount++;
                return { ...c, chargerId: `AC-${String(acCount).padStart(2, '0')}` };
            }
        });
    };

    const handleAddCharger = (type) => {
        setFormData(prev => {
            const newCharger = { 
                chargerId: '', 
                type: type, 
                power: isDC(type) ? 60 : 22, 
                totalSlots: 1, 
                pricePerUnit: isDC(type) ? 18.00 : 10.00, 
                pricePerMinute: 0 
            };
            return { ...prev, chargers: reindexChargers([...prev.chargers, newCharger]) };
        });
    };

    const handleChargerChange = (index, field, value) => {
        setFormData(prev => {
            const newChargers = [...prev.chargers];
            newChargers[index][field] = value;
            if (field === 'type') {
                newChargers[index].power = isDC(value) ? 60 : 22;
                newChargers[index].pricePerUnit = isDC(value) ? 18.00 : 10.00;
                return { ...prev, chargers: reindexChargers(newChargers) };
            }
            return { ...prev, chargers: newChargers };
        });
    };

    const removeCharger = (index) => {
        setFormData(prev => ({
            ...prev,
            chargers: reindexChargers(prev.chargers.filter((_, i) => i !== index))
        }));
    };

    const amenitiesList = [
        { id: 'parking', label: 'Parking', icon: <Navigation size={14} /> },
        { id: 'washroom', label: 'Washroom', icon: <Shield size={14} /> },
        { id: 'cafe', label: 'Café', icon: <Coffee size={14} /> },
        { id: 'wifi', label: 'Wi-Fi', icon: <Wifi size={14} /> },
        { id: 'lounge', label: 'Waiting Lounge', icon: <Clock size={14} /> },
        { id: 'security', label: 'Security', icon: <Shield size={14} /> },
        { id: '24x7', label: '24x7 Access', icon: <Clock size={14} /> },
        { id: 'shop', label: 'Shop', icon: <ImageIcon size={14} /> },
        { id: 'water', label: 'Drinking Water', icon: <Utensils size={14} /> },
        { id: 'other', label: 'Other', icon: <Info size={14} /> },
    ];

    const handleAmenityToggle = (id) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(id)
                ? prev.amenities.filter(a => a !== id)
                : [...prev.amenities, id]
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setUploadingImage(true);
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);
            
            const res = await uploadStationImage(uploadData, token);
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, res.data.imageUrl]
                }));
                toast.success("Image uploaded successfully!");
            }
        } catch (error) {
            toast.error("Failed to upload image");
        } finally {
            setUploadingImage(false);
            e.target.value = null; // reset input
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                operatingHours: typeof formData.operatingHours === 'object' 
                    ? `${formData.operatingHours.from} - ${formData.operatingHours.to}` 
                    : formData.operatingHours
            };

            if (onSubmitOverride) {
                await onSubmitOverride(payload);
            } else {
                const response = await axios.post(`${backendURL}/api/station-owner/add`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    toast.success("Station request submitted!");
                    if (onSuccess) onSuccess();
                    else window.location.reload();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save station");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------
    // 🔥 Calculations for Sidebar
    // -------------------------------
    const acChargers = formData.chargers.filter(c => !isDC(c.type));
    const dcChargers = formData.chargers.filter(c => isDC(c.type));
    const avgAcPrice = acChargers.length ? (acChargers.reduce((acc, c) => acc + Number(c.pricePerUnit), 0) / acChargers.length).toFixed(2) : "0.00";
    const avgDcPrice = dcChargers.length ? (dcChargers.reduce((acc, c) => acc + Number(c.pricePerUnit), 0) / dcChargers.length).toFixed(2) : "0.00";
    const overallAvg = formData.chargers.length ? (formData.chargers.reduce((acc, c) => acc + Number(c.pricePerUnit), 0) / formData.chargers.length).toFixed(2) : "0.00";


    return (
        <div className="fixed inset-0 z-[5000] bg-[#F8FAF9] flex flex-col font-sans">
            {/* Top Bar */}
            <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800">Registration</h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-[#1BAC4B]" /> Draft Saved 12:45 PM
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow overflow-y-auto p-8">
                <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN */}
                    <div className="col-span-12 lg:col-span-8">
                        
                        {/* 1. Basic Info & Location */}
                        <SectionCard icon={<ImageIcon size={18} />} title="Basic Information & Location">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Station Name <span className="text-red-500">*</span></label>
                                        <input 
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium"
                                            placeholder="Enter station name"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Station Type <span className="text-red-500">*</span></label>
                                        <select 
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium bg-white"
                                            value={formData.stationType}
                                            onChange={e => setFormData({...formData, stationType: e.target.value})}
                                        >
                                            <option value="manned">Manned</option>
                                            <option value="unmanned">Unmanned</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Description <span className="text-red-500">*</span></label>
                                        <textarea 
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium h-24 resize-none"
                                            placeholder="Describe your station..."
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-44 rounded-xl border border-slate-200 overflow-hidden relative group">
                                        <MapContainer center={[formData.location.lat, formData.location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <LocationMarker position={formData.location} setPosition={(pos) => setFormData({...formData, location: pos})} />
                                            <RecenterMap lat={formData.location.lat} lng={formData.location.lng} />
                                        </MapContainer>
                                        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm">
                                            {formData.address || "Select location on map"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Address <span className="text-red-500">*</span></label>
                                        <input 
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium"
                                            placeholder="Enter full address"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-medium" value={formData.location.lat} readOnly />
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(p => setFormData({...formData, location: { lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }}));
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 border border-[#1BAC4B] text-[#1BAC4B] rounded-lg px-4 py-2.5 text-[11px] font-bold hover:bg-[#1BAC4B]/5 transition-all"
                                        >
                                            <Navigation size={14} /> Detect Location
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* 2. Station Images */}
                        <SectionCard icon={<ImageIcon size={18} />} title="Station Images" extra={<span className="text-[10px] font-bold text-slate-400">Upload up to 5 images</span>}>
                            <div className="flex gap-4">
                                <label className="w-40 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1BAC4B] hover:bg-slate-50 transition-all relative overflow-hidden">
                                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={uploadingImage || formData.images.length >= 5} />
                                    {uploadingImage ? (
                                        <Loader size={24} className="text-[#1BAC4B] animate-spin" />
                                    ) : (
                                        <>
                                            <Upload size={24} className="text-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-400 text-center px-4">Upload Image<br/><span className="text-[8px]">PNG, JPG up to 5MB</span></span>
                                        </>
                                    )}
                                </label>
                                <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
                                    {formData.images.map((imgUrl, i) => (
                                        <div key={i} className="w-40 h-32 rounded-xl overflow-hidden border border-slate-200 relative group shrink-0">
                                            <img src={imgUrl} className="w-full h-full object-cover" alt={`Station ${i}`} />
                                            <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:bg-red-50"><X size={12} /></button>
                                        </div>
                                    ))}
                                    {formData.images.length < 5 && (
                                        <label className="w-32 h-32 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-[#1BAC4B] transition-all cursor-pointer shrink-0">
                                            <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={uploadingImage} />
                                            <Plus size={20} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Add More</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        {/* 3. Charger Management */}
                        <SectionCard 
                            icon={<Zap size={18} />} 
                            title="Charger Management" 
                            extra={
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => handleAddCharger('Type 2')} className="px-4 py-1.5 border border-[#1BAC4B] text-[#1BAC4B] rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-[#1BAC4B]/5 transition-all"><Plus size={14} /> Add AC Charger</button>
                                    <button type="button" onClick={() => handleAddCharger('CCS2')} className="px-4 py-1.5 bg-[#0F172A] text-white rounded-lg text-[11px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"><Plus size={14} /> Add DC Fast Charger</button>
                                </div>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connector</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Power</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹/kWh)</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {formData.chargers.map((c, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-all">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Zap size={14} className={isDC(c.type) ? "text-orange-500" : "text-blue-500"} />
                                                        <span className={`text-xs font-black ${isDC(c.type) ? "text-orange-600" : "text-blue-600"}`}>{c.chargerId}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-700">{isDC(c.type) ? "DC Fast" : "AC"}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isDC(c.type) ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>{isDC(c.type) ? "DC" : "AC"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <select 
                                                        className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                                                        value={c.type}
                                                        onChange={(e) => handleChargerChange(i, 'type', e.target.value)}
                                                    >
                                                        <option value="CCS2">CCS2</option>
                                                        <option value="CHAdeMO">CHAdeMO</option>
                                                        <option value="Type 2">Type 2</option>
                                                        <option value="AC001">AC001</option>
                                                    </select>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number" 
                                                            className="w-12 bg-slate-100/50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1BAC4B]"
                                                            value={c.power}
                                                            onChange={(e) => handleChargerChange(i, 'power', e.target.value)}
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400">kW</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <input 
                                                        type="number" 
                                                        className="w-16 bg-slate-100/50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1BAC4B]"
                                                        value={c.pricePerUnit}
                                                        onChange={(e) => handleChargerChange(i, 'pricePerUnit', e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1BAC4B]" />
                                                        <span className="text-[10px] font-bold text-[#1BAC4B]">Active</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        <button type="button" className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"><Edit3 size={14} /></button>
                                                        <button type="button" onClick={() => removeCharger(i)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* 4. Business & Contact Info */}
                        <SectionCard icon={<Phone size={18} />} title="Business & Contact Information" extra={<span className="text-[10px] font-bold text-slate-400">Optional</span>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Operator Name</label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium bg-white"
                                        placeholder="e.g. John Doe"
                                        value={formData.operatorName}
                                        onChange={e => setFormData({...formData, operatorName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Contact Number</label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium bg-white"
                                        placeholder="e.g. +91 9876543210"
                                        value={formData.contactNumber}
                                        onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Email Address</label>
                                    <input 
                                        type="email"
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium bg-white"
                                        placeholder="e.g. support@station.com"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">GST Number</label>
                                    <input 
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#1BAC4B] transition-all text-sm font-medium bg-white uppercase"
                                        placeholder="e.g. 22AAAAA0000A1Z5"
                                        value={formData.gstNo}
                                        onChange={e => setFormData({...formData, gstNo: e.target.value})}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* 5. Amenities & Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SectionCard icon={<Navigation size={18} />} title="Amenities">
                                <div className="grid grid-cols-2 gap-3">
                                    {amenitiesList.map(a => (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleAmenityToggle(a.id);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-xs font-bold ${formData.amenities.includes(a.id) ? 'bg-[#F0FAF4] border-[#1BAC4B] text-[#1BAC4B]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.amenities.includes(a.id) ? 'bg-[#1BAC4B] border-[#1BAC4B]' : 'bg-white border-slate-200'}`}>
                                                {formData.amenities.includes(a.id) && <Check size={10} className="text-white" />}
                                            </div>
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard icon={<Clock size={18} />} title="Operating Hours & Notes">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">From</label>
                                            <div className="relative">
                                                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none" value={formData.operatingHours.from} onChange={e => setFormData({...formData, operatingHours: {...formData.operatingHours, from: e.target.value}})} />
                                                <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                            </div>
                                        </div>
                                        <div className="mt-5 text-slate-300">—</div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">To</label>
                                            <div className="relative">
                                                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none" value={formData.operatingHours.to} onChange={e => setFormData({...formData, operatingHours: {...formData.operatingHours, to: e.target.value}})} />
                                                <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Additional Notes</label>
                                        <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium h-20 resize-none outline-none focus:border-[#1BAC4B]" placeholder="Any extra details..." value={formData.additionalNotes} onChange={e => setFormData({...formData, additionalNotes: e.target.value})} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - PREVIEW */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        
                        {/* Live Preview Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye size={16} className="text-[#1BAC4B]" />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Live Preview</span>
                                </div>
                                <button type="button" className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:underline"><Edit3 size={10} /> Edit Image</button>
                            </div>
                            
                            <div className="p-6">
                                <div className="aspect-[16/9] rounded-xl bg-slate-100 overflow-hidden mb-4 relative">
                                    <img src={formData.images.length > 0 ? formData.images[0] : "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=800&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-slate-800 shadow-sm">{formData.status || "Pending"}</div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">{formData.name || "Station Name"}</h3>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin size={14} />
                                        <span className="text-[11px] font-bold truncate">{formData.address || "Bhopal, Madhya Pradesh, India"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="bg-[#E8F5EE] text-[#1BAC4B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">{formData.stationType}</span>
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">{formData.chargers.length} Chargers</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={14} className="text-[#1BAC4B]" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pricing Summary</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-700 uppercase">₹ / kWh</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-400">AC Price</span>
                                                <span className="text-slate-700">₹ {avgAcPrice} / kWh</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-400">DC Fast Price</span>
                                                <span className="text-slate-700">₹ {avgDcPrice} / kWh</span>
                                            </div>
                                            <div className="flex justify-between items-center px-3 py-2.5 bg-[#F0FAF4] rounded-lg">
                                                <span className="text-[10px] font-black text-[#1BAC4B] uppercase tracking-widest">Avg. Price</span>
                                                <span className="text-sm font-black text-[#1BAC4B]">₹ {overallAvg} / kWh</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Navigation size={14} className="text-[#1BAC4B]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amenities ({formData.amenities.length})</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {formData.amenities.slice(0, 4).map(id => (
                                                <div key={id} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                    <div className="w-1 h-1 rounded-full bg-[#1BAC4B]" />
                                                    {amenitiesList.find(a => a.id === id)?.label}
                                                </div>
                                            ))}
                                            {formData.amenities.length > 4 && (
                                                <div className="text-[10px] font-black text-slate-300">+{formData.amenities.length - 4} More...</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                        <div className="flex gap-3">
                                            <Info size={16} className="text-orange-500 shrink-0" />
                                            <div className="space-y-1">
                                                <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest leading-none">Next Steps</h4>
                                                <p className="text-[10px] font-medium text-orange-400 leading-relaxed">After submission, our team will review your station details. You'll be notified within 1-2 business days.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button type="button" onClick={onCancel} className="flex-1 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">Cancel</button>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }}
                                            disabled={loading}
                                            className="flex-[2] bg-[#1BAC4B] text-white py-3.5 rounded-xl font-bold hover:bg-[#189a43] transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 text-xs"
                                        >
                                            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Submit Station Request')} <Navigation size={14} className="rotate-90" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddStationForm;
