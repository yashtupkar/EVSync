import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  MessageSquare,
  MapPin,
  UserPlus,
  Trash2,
  Edit2,
  ShieldAlert,
  AlertCircle,
  Navigation,
  Heart,
  Mic,
  BookOpen,
  Share2,
  ArrowLeft,
  X,
  Plus,
  Check,
  Zap,
  PhoneCall
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

// Fix for Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 15);
    }
  }, [coords, map]);
  return null;
};

const EmergencyPage = () => {
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [personalContacts, setPersonalContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "Primary" });
  const [editingId, setEditingId] = useState(null);
  const user = useSelector((state) => state.auth?.user);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const watchId = useRef(null);

  // Government Helplines
  const govContacts = [
    { id: 1, name: "Police", number: "112", icon: "🚓", color: "blue" },
    { id: 2, name: "Ambulance", number: "108", icon: "🚑", color: "red" },
    { id: 3, name: "Fire Service", number: "101", icon: "🚒", color: "orange" },
    { id: 4, name: "Women Helpline", number: "1091", icon: "👩‍✈️", color: "purple" },
    { id: 5, name: "Highway Patrol", number: "1033", icon: "🛣️", color: "emerald" },
    { id: 6, name: "Child Helpline", number: "1098", icon: "👧", color: "pink" },
    { id: 7, name: "Senior Citizen", number: "14567", icon: "👴", color: "indigo" },
    { id: 8, name: "Disaster Mgmt", number: "1078", icon: "🚨", color: "amber" },
  ];

  // Load contacts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("evsync_emergency_contacts");
    if (saved) {
      setPersonalContacts(JSON.parse(saved));
    }
  }, []);

  // Handle location tracking
  useEffect(() => {
    if (isTracking) {
      if (navigator.geolocation) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            console.error(err);
            toast.error("Location access denied");
            setIsTracking(false);
          },
          { enableHighAccuracy: true }
        );
      }
    } else {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    }
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isTracking]);

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    let updated;
    if (editingId) {
      updated = personalContacts.map(c => c.id === editingId ? { ...newContact, id: editingId } : c);
      setEditingId(null);
    } else {
      updated = [...personalContacts, { ...newContact, id: Date.now() }];
    }

    setPersonalContacts(updated);
    localStorage.setItem("evsync_emergency_contacts", JSON.stringify(updated));
    setNewContact({ name: "", phone: "", relation: "Primary" });
    setShowAddModal(false);
    toast.success(editingId ? "Contact updated" : "Contact added");
  };

  const deleteContact = (id) => {
    const updated = personalContacts.filter(c => c.id !== id);
    setPersonalContacts(updated);
    localStorage.setItem("evsync_emergency_contacts", JSON.stringify(updated));
    toast.success("Contact removed");
  };

  const editContact = (contact) => {
    setNewContact(contact);
    setEditingId(contact.id);
    setShowAddModal(true);
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  const handleSMS = (contact, type = "General Emergency") => {
    const locStr = location ? ` Location: https://www.google.com/maps?q=${location.lat},${location.lng}` : "";
    const safeName = user?.name || user?.fullName || "A user";
    const message = `🚨 EMERGENCY ALERT 🚨\n${safeName} has reported a [${type}].${locStr}. `;
    window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
  };

  const handleSMSFallback = (contact, type, locationCoords) => {
    const locStr = locationCoords ? ` Location: https://www.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}` : "";
    const safeName = user?.name || user?.fullName || "A user";
    const message = `🚨 EMERGENCY ALERT 🚨\n${safeName} has reported a [${type}].${locStr}`;

    if (navigator.share) {
      navigator.share({
        title: 'Emergency SOS Alert',
        text: message,
      }).catch((error) => {
        console.error("Error sharing SOS:", error);
        // Fallback if sharing is cancelled or fails
        window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
      });
    } else {
      window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
    }
  };

  const emergencyTypes = [
    { id: 'General SOS', label: 'General SOS', desc: 'General emergency assistance', icon: "🆘", bg: 'bg-red-50', text: 'text-red-500' },
    { id: 'Robbery', label: 'Robbery', desc: 'Report theft or robbery incident', icon: "🔪", bg: 'bg-orange-50', text: 'text-orange-500' },
    { id: 'Medical Emergency', label: 'Medical Emergency', desc: 'Medical help required urgently', icon: "🏥", bg: 'bg-pink-50', text: 'text-pink-500' },
    { id: 'Fire', label: 'Fire', desc: 'Report fire emergency', icon: "🔥", bg: 'bg-amber-50', text: 'text-amber-500' },
    { id: 'Accident', label: 'Accident', desc: 'Road accident assistance', icon: "🚗", bg: 'bg-blue-50', text: 'text-blue-500' },
    { id: 'Vehicle Breakdown', label: 'Vehicle Breakdown', desc: 'Vehicle breakdown assistance', icon: "🚧", bg: 'bg-purple-50', text: 'text-purple-500' },
  ];

  const handleSOS = () => {
    if (personalContacts.length === 0) {
      toast.error("Please add emergency contacts first!");
      return;
    }
    setShowTypeModal(true);
  };

  const confirmSOS = async (type) => {
    setShowTypeModal(false);
    const toastId = toast.loading(`Sending ${type} Alert to all contacts...`);

    const locStr = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : "Location tracking is currently OFF or unavailable.";

    try {
      const response = await fetch(`${backendURL}/api/emergency/send-sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: personalContacts,
          locationMessage: locStr,
          userName: user?.name || user?.fullName || "A user",
          emergencyType: type,
          userLat: location?.lat,
          userLng: location?.lng
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `${type} sent successfully!`, { id: toastId });
      } else {
        throw new Error(data.message || "Failed to send SOS.");
      }
    } catch (error) {
      console.error("SOS Error:", error);
      toast.error("Failed to send SOS via Twilio. Falling back to local SMS app.", { id: toastId });
      // Fallback to local SMS app for primary contact
      const primary = personalContacts.find(c => c.relation === "Primary") || personalContacts[0];
      if (primary) handleSMSFallback(primary, type, location);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#F8FAF9] p-4 md:p-8 pb-24 relative overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white rounded-full shadow-sm transition-all text-gray-600">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex flex-wrap items-center gap-2">
              Emergency & SOS <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-3 py-1 bg-red-100 text-red-600 text-[10px] md:text-xs font-bold rounded-full uppercase">You are safe</motion.span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Get help instantly. Contact government services or alert your emergency contacts.</p>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${isTracking ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-bold text-gray-900 truncate">Live Safety Status</p>
            <p className="text-[9px] md:text-[10px] text-gray-500 font-medium">{isTracking ? "Location sharing is ON" : "Location sharing is OFF"}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTracking(!isTracking)}
            className={`px-3 md:px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-bold transition-all shrink-0 ${isTracking ? 'bg-red-50 text-red-600' : 'bg-green-500 text-white'}`}
          >
            {isTracking ? "Stop" : "Enable"}
          </motion.button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: SOS & Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Main SOS Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-2xl shadow-red-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

            <div className="relative flex flex-col items-center text-center space-y-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSOS}
                className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] relative group"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-hover:animate-none"></div>
                <span className="text-red-600 text-4xl md:text-5xl font-black tracking-tighter notranslate">SOS</span>
              </motion.button>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">Tap to Send Emergency Alert</h3>
                <p className="text-white/80 text-sm font-medium px-8">Sends your live location to all contacts instantly</p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full">
                {[
                  { icon: <MapPin />, label: "Share Location" },
                  { icon: <MessageSquare />, label: "Send Message" },
                  { icon: <PhoneCall />, label: "Call Emergency" }
                ].map((action, i) => (
                  <button key={i} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-red-500 transition-all">
                      {action.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight">{action.label}</span>
                  </button>
                ))}
              </div>

              <div className="w-full bg-black/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Navigation size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">Start Live Tracking</p>
                    <p className="text-[10px] text-white/60">Real-time safety update</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${isTracking ? 'bg-white' : 'bg-white/20'}`}
                >
                  <motion.div
                    animate={{ x: isTracking ? 24 : 0 }}
                    className={`w-4 h-4 rounded-full ${isTracking ? 'bg-red-500' : 'bg-white'}`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Zap size={20} className="text-emerald-500" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                { icon: <MapPin className="text-emerald-500" size={20} />, label: "Share Live Location", bg: "bg-emerald-50" },
                { icon: <Navigation className="text-blue-500" size={20} />, label: "Send Custom Message", bg: "bg-blue-50" },
                { icon: <Mic className="text-red-500" size={20} />, label: "Start Audio Recording", bg: "bg-red-50" },
                { icon: <BookOpen className="text-indigo-500" size={20} />, label: "Open Safety Guide", bg: "bg-indigo-50" }
              ].map((item, i) => (
                <button key={i} className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all flex flex-col items-center gap-2 md:gap-3 text-center shadow-sm">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-gray-700 leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Gov Contacts */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              🇮🇳 Government Emergency Contacts
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
            {govContacts.map((contact) => (
              <motion.div
                key={contact.id}
                whileHover={{ y: -5 }}
                className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 text-center"
              >
                <p className={` text-3xl`}>
                  {contact.icon}
                </p>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{contact.name}</p>
                  <p className="text-xl font-black text-gray-900 tracking-tighter">{contact.number}</p>
                </div>

              </motion.div>
            ))}
          </div>

          {/* Live Location Map */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                <span className="font-bold text-gray-900">Live Location</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isTracking ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {isTracking ? "Tracking ON" : "Tracking OFF"}
              </div>
            </div>

            <div className="h-48 md:h-64 rounded-2xl z-10 overflow-hidden bg-gray-100 border border-gray-100 relative">
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {location && (
                  <>
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>You are here</Popup>
                    </Marker>
                    <RecenterMap coords={location} />
                  </>
                )}
              </MapContainer>

              {!location && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center flex-col text-center p-6">
                  <AlertCircle size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-600">Enable tracking to see your live location</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsTracking(true)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Navigation size={14} /> Refresh Location
              </button>
              <button
                onClick={() => {
                  if (location) {
                    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Location link copied!");
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-100"
              >
                <Share2 size={14} /> Share Link
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Emergency Contacts */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">Your Emergency Contacts</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingId(null);
                setNewContact({ name: "", phone: "", relation: "Primary" });
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-100"
            >
              <Plus size={14} /> Add Contact
            </motion.button>
          </div>

          <div className="space-y-4">
            {personalContacts.map((contact) => (
              <motion.div
                layout
                key={contact.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                  {contact.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${contact.relation === 'Primary' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {contact.relation}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">+91 {contact.phone}</p>
                </div>
                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
                  <button onClick={() => handleCall(contact.phone)} className="p-1.5 md:p-2 hover:bg-green-50 text-green-600 rounded-lg"><Phone size={14} /></button>
                  <button onClick={() => handleSMS(contact)} className="p-1.5 md:p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><MessageSquare size={14} /></button>
                  <button onClick={() => editContact(contact)} className="p-1.5 md:p-2 hover:bg-gray-50 text-gray-400 rounded-lg"><Edit2 size={14} /></button>
                  <button onClick={() => deleteContact(contact.id)} className="p-1.5 md:p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}

            {personalContacts.length === 0 && (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <UserPlus size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">No contacts added</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Add someone you trust</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
            <div className="bg-emerald-500 p-2 rounded-xl text-white">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Safety Tip</p>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed mt-1">Keep your location sharing active while traveling in unfamiliar areas to ensure quick help arrival.</p>
            </div>
          </div>
        </div>
      </div>



      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 pb-8 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-2xl md:rounded-xl shadow-2xl relative overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-gray-900">{editingId ? "Edit Contact" : "Add Emergency Contact"}</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mom"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-red-500 transition-all font-bold text-gray-900"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength="10"
                        placeholder="98765 43210"
                        className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-red-500 transition-all font-bold text-gray-900"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value.replace(/\D/g, "") })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Priority</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["Primary", "Secondary"].map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setNewContact({ ...newContact, relation: rel })}
                          className={`py-3 rounded-2xl text-xs font-bold transition-all border ${newContact.relation === rel ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-[1.5rem] font-bold mt-4 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} /> {editingId ? "Update Contact" : "Save Contact"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTypeModal && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 pb-8 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTypeModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden z-10"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-red-100 flex items-center justify-center text-red-500 bg-red-50 relative">
                      <div className="absolute inset-0 rounded-full border border-red-200 animate-ping opacity-20"></div>
                      <span className="text-xs font-black">SOS</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900">What is your emergency?</h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 uppercase tracking-widest">Select an option to alert your contacts instantly</p>
                    </div>
                  </div>
                  <button onClick={() => setShowTypeModal(false)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-all">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {emergencyTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => confirmSOS(type.id)}
                      className="p-4 rounded-[1.25rem] border border-gray-100/80 hover:border-red-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(239,68,68,0.08)] transition-all flex items-center gap-4 bg-white hover:bg-red-50/10 group text-left"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type.bg} text-3xl shrink-0`}>
                        {type.icon}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">{type.label}</span>
                        <span className="block text-[10px] text-gray-500 font-medium mt-0.5 leading-tight">{type.desc}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-green-100/50">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-800">Your location will be shared</p>
                    <p className="text-[10px] text-green-600/80 font-medium mt-0.5">Your live location will be shared with your emergency contacts.</p>
                  </div>
                </div>


              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmergencyPage;
