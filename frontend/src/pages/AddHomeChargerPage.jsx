import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  ArrowLeft, 
  Camera, 
  ChevronRight, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  Check, 
  Home, 
  Info,
  Car,
  Bike,
  Plus,
  Trash2,
  Loader2,
  UploadCloud,
  X,
  Clock,
  Star,
  DollarSign,
  Users,
  Settings,
  ChevronDown,
  Navigation
} from "lucide-react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) });
        },
    });
    const lat = parseFloat(position.lat);
    const lng = parseFloat(position.lng);
    return (lat && lng) ? <Marker position={[lat, lng]} /> : null;
};

// Helper to recenter map when coordinates change
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            map.setView([parsedLat, parsedLng]);
        }
    }, [lat, lng, map]);
    return null;
};

const AddHomeChargerPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    propertyType: "",
    parkingType: "",
    suitableFor: [],
    address: "",
    city: "",
    state: "",
    pinCode: "",
    location: { lat: 23.2599, lng: 77.4126 },
    chargers: [{ chargerId: "HOME-01", type: "Type 2", power: 7, pricePerUnit: 12 }],
    images: [],
    availabilityType: "24/7",
    startTime: "09:00",
    endTime: "21:00",
    operatingHours: "24/7",
    houseRules: "",
    additionalNotes: "",
    contactNumber: user?.mobile || "",
    email: user?.email || "",
    operatorName: user?.name || "",
    stationType: "home-charger"
  });

  const propertyTypes = ["Apartment", "Independent House", "Villa", "Gated Community", "Office Space"];
  const parkingTypes = ["Covered", "Open", "Private Garage", "Basement"];
  const cities = ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"];
  const states = ["Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Rajasthan", "Gujarat"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getStandardPrice = (type) => {
    const prices = {
      "Type 2": 12,
      "CCS2": 18,
      "CHAdeMO": 18,
      "GB/T": 15,
      "15A Socket": 8
    };
    return prices[type] || 12;
  };

  const handleSuitableFor = (type) => {
    const newSuitable = formData.suitableFor.includes(type)
      ? formData.suitableFor.filter(t => t !== type)
      : [...formData.suitableFor, type];
    setFormData({ ...formData, suitableFor: newSuitable });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const response = await fetch(`${backendURL}/api/upload/station-image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: uploadData
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.imageUrl]
        }));
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(`${backendURL}/api/station-owner/add-request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Home charger listed successfully!");
        navigate("/host-dashboard");
      } else {
        toast.error(data.message || "Failed to list charger");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewImage = formData.images[0] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className=" mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between ">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
              
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Add Your Home Charger</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">List your home charger and earn by sharing it with EV owners.</p>
                </div>
              </div>
            </div>

          
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Side: Form Content */}
          <div className="lg:col-span-8 space-y-4">

            {/* Section 1: Add Photos */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">1</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Add Photos <span className="text-red-500">*</span></h2>
                </div>
                <p className="text-sm text-gray-500 ml-11 mb-4">Upload clear photos of your charger and location.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Upload Button */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="aspect-square bg-emerald-50 p-4 cursor-pointer rounded-xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
                  >
                    {isUploading ? (
                      <Loader2 size={24} className="text-emerald-600 animate-spin" />
                    ) : (
                      <UploadCloud size={28} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-xs font-semibold text-emerald-700">
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </span>
                    <span className="text-[10px] text-emerald-500">JPG, PNG (Max 5MB)</span>
                  </button>

                  {/* Uploaded Images */}
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden relative group bg-gray-100">
                      <img src={img} alt={`Charger ${i + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {formData.images.length === 0 && !isUploading && (
                    <div className="col-span-2 sm:col-span-3 flex items-center px-4 text-xs text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No photos uploaded yet. High quality photos attract more users.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Basic Information */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">2</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Basic Information</h2>
                </div>

                {/* Listing Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Listing Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Home Charger in Green Street, Bhopal"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-gray-400">{formData.name.length}/60</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your charger, location, parking, and other key details..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-gray-400">{formData.description.length}/500</span>
                  </div>
                </div>

                {/* Property & Parking Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Property Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all appearance-none"
                      >
                        <option value="">Select Property Type</option>
                        {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Parking Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        name="parkingType"
                        value={formData.parkingType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all appearance-none"
                      >
                        <option value="">Select Parking Type</option>
                        {parkingTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Suitable For */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Suitable For <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleSuitableFor("4 Wheeler")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                        formData.suitableFor.includes("4 Wheeler") 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-emerald-200"
                      }`}
                    >
                      <Car size={18} />
                      <span className="text-sm font-semibold">4 Wheeler</span>
                    </button>
                    <button 
                      onClick={() => handleSuitableFor("2 Wheeler")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                        formData.suitableFor.includes("2 Wheeler") 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-emerald-200"
                      }`}
                    >
                      <Bike size={18} />
                      <span className="text-sm font-semibold">2 Wheeler</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Location */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">3</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Location Details</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Full Address <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House No., Street, Area, Landmark"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">City <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                        >
                          <option value="">Select City</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">State <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                        >
                          <option value="">Select State</option>
                          {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Pin Code <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        placeholder="e.g. 462001"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Latitude <span className="text-red-500">*</span></label>
                      <input 
                        type="number"
                        step="any"
                        value={formData.location.lat}
                        onChange={(e) => setFormData({...formData, location: {...formData.location, lat: e.target.value}})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Longitude <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          step="any"
                          value={formData.location.lng}
                          onChange={(e) => setFormData({...formData, location: {...formData.location, lng: e.target.value}})}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(p => setFormData({
                                ...formData, 
                                location: { lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }
                              }));
                            }
                          }}
                          className="px-4 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
                        >
                          <Navigation size={14} /> Detect
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Map Integration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">Pinpoint on Map</label>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Interactive Map Picker</span>
                    </div>
                    <div className="w-full h-80 bg-gray-100 rounded-2xl relative overflow-hidden border border-gray-200 shadow-inner z-0 min-h-[320px]">
                      <MapContainer 
                        center={[
                          parseFloat(formData.location.lat) || 23.2599, 
                          parseFloat(formData.location.lng) || 77.4126
                        ]} 
                        zoom={13} 
                        style={{ height: "320px", width: "100%" }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        <LocationMarker position={formData.location} setPosition={(pos) => setFormData({...formData, location: pos})} />
                        <RecenterMap lat={formData.location.lat} lng={formData.location.lng} />
                      </MapContainer>
                      
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-lg flex items-center justify-between z-[1000]">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instructions</p>
                          <p className="text-xs font-bold text-gray-800">Click map or drag pin to move</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-emerald-600 uppercase">GPS Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Charger Details & Pricing */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">4</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Charger Details & Pricing</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Charger Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={formData.chargers[0].type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const newChargers = [...formData.chargers];
                          newChargers[0].type = newType;
                          newChargers[0].pricePerUnit = getStandardPrice(newType);
                          // Ensure chargerId exists
                          if (!newChargers[0].chargerId) newChargers[0].chargerId = "HOME-01";
                          setFormData({...formData, chargers: newChargers});
                        }}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none font-bold text-gray-700"
                      >
                        <option value="Type 2">Type 2 (Standard)</option>
                        <option value="CCS2">CCS2 (DC Fast)</option>
                        <option value="CHAdeMO">CHAdeMO</option>
                        <option value="GB/T">GB/T</option>
                        <option value="15A Socket">15A Socket (Slow)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Power Rating (kW) <span className="text-red-500">*</span></label>
                    <input 
                      type="number"
                      value={formData.chargers[0].power}
                      onChange={(e) => {
                        const newChargers = [...formData.chargers];
                        newChargers[0].power = parseFloat(e.target.value);
                        setFormData({...formData, chargers: newChargers});
                      }}
                      placeholder="e.g. 7"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Standard Price (Fixed)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={formData.chargers[0].pricePerUnit}
                        readOnly
                        className="w-full pl-8 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none cursor-not-allowed"
                      />
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">₹/kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Availability Settings */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">5</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Availability Settings</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {["24/7", "Daytime Only", "Night Only", "Weekends", "Custom"].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, availabilityType: type, operatingHours: type === "24/7" ? "24/7" : formData.operatingHours})}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 ${
                          formData.availabilityType === type 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100" 
                            : "bg-white border-gray-100 text-gray-600 hover:border-emerald-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {formData.availabilityType === "Custom" && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Available From</label>
                        <div className="relative">
                          <input 
                            type="time" 
                            value={formData.startTime}
                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                          />
                          <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Available To</label>
                        <div className="relative">
                          <input 
                            type="time" 
                            value={formData.endTime}
                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                          />
                          <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 6: Host Information */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">6</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Host Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Your Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="operatorName"
                      value={formData.operatorName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your mobile number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>

                {/* Security Note */}
                <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">
                    Your contact details are secure and will only be shared with users after a confirmed booking.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: Additional Information */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-700">7</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Additional Information <span className="text-gray-400 font-normal">(Optional)</span></h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">House Rules</label>
                    <textarea 
                      name="houseRules"
                      value={formData.houseRules}
                      onChange={handleInputChange}
                      placeholder="e.g., No smoking, Be on time, Handle with care..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none"
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-gray-400">{formData.houseRules.length}/300</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Additional Notes</label>
                    <textarea 
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleInputChange}
                      placeholder="Any other information you want to share..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none"
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-gray-400">{formData.additionalNotes.length}/300</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Sidebar */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Listing Preview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
              <div className="p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Listing Preview</h3>
                <p className="text-xs text-gray-500 mb-4">See how your listing will appear to EV owners.</p>

                {/* Preview Card */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                  <div className="aspect-video bg-gray-100 relative">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Camera size={32} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">No Preview Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase text-emerald-700 tracking-wider flex items-center gap-1 shadow-sm">
                      <Zap size={10} className="fill-emerald-700" /> Home Charger
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm truncate">
                      {formData.name || "Listing Title"}
                    </h4>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin size={12} />
                      <span className="text-xs truncate">
                        {formData.city ? `${formData.city}, ${formData.state}` : "Your location will appear here"}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-semibold text-gray-600 uppercase tracking-wide">AC Charger</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-semibold text-gray-600 uppercase tracking-wide">7 kW</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Type 2</span>
                      <span className="bg-emerald-50 px-2 py-1 rounded text-[10px] font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                        <Check size={8} /> Available
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Verified Hub</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">₹{formData.chargers[0].pricePerUnit}/kWh</span>
                    </div>
                  </div>
                </div>

                {/* Preview Details */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Zap size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Your charger details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Availability & pricing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Star size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Ratings and reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5">
                <h4 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-emerald-600" /> 
                  Tips for a Great Listing
                </h4>
                <ul className="space-y-3">
                  {[
                    "Upload clear and bright photos",
                    "Provide accurate location",
                    "Set competitive pricing",
                    "Keep your calendar updated"
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-emerald-800">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Why List Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Why List Your Home Charger?</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <DollarSign size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Earn Extra Income</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Make money by sharing your charger.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Help EV Community</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Support EV owners in your area.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Safe & Secure</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Verified users and secure payments.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                      <Settings size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Full Control</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">You decide availability and pricing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-1">Need Help?</h4>
                <p className="text-xs text-gray-500 mb-4">Check our guidelines or contact support</p>

                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <HelpCircle size={16} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-700">View Listing Guidelines</span>
                    <ChevronRight size={14} className="text-gray-400 ml-auto" />
                  </button>
                  <button className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <Info size={16} className="text-blue-600" />
                    <span className="text-xs font-semibold text-gray-700">Contact Support</span>
                    <ChevronRight size={14} className="text-gray-400 ml-auto" />
                  </button>
                </div>
              </div>
            </div>

            {/* Safety Card */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">Your Safety Matters</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      All listings are reviewed. We ensure a safe experience for you and EV owners.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AddHomeChargerPage;
