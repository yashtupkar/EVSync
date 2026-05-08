import React, { useState } from "react";
import { ShieldAlert, AlertCircle, Heart, Zap, MapPin, Navigation, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const emergencyTypes = [
  { id: 'General SOS', label: 'General SOS', desc: 'General emergency assistance', icon: "🆘", bg: 'bg-red-50', text: 'text-red-500' },
  { id: 'Robbery', label: 'Robbery', desc: 'Report theft or robbery incident', icon: "🔪", bg: 'bg-orange-50', text: 'text-orange-500' },
  { id: 'Medical Emergency', label: 'Medical Emergency', desc: 'Medical help required urgently', icon: "🏥", bg: 'bg-pink-50', text: 'text-pink-500' },
  { id: 'Fire', label: 'Fire', desc: 'Report fire emergency', icon: "🔥", bg: 'bg-amber-50', text: 'text-amber-500' },
  { id: 'Accident', label: 'Accident', desc: 'Road accident assistance', icon: "🚗", bg: 'bg-blue-50', text: 'text-blue-500' },
  { id: 'Vehicle Breakdown', label: 'Vehicle Breakdown', desc: 'Vehicle breakdown assistance', icon: "🚧", bg: 'bg-purple-50', text: 'text-purple-500' },
];

const GlobalSOSButton = ({ 
  isFloating = true, 
  buttonClasses = "w-20 h-20 bg-red-600 text-white shadow-[0_10px_40px_rgba(220,38,38,0.4)] border-4 border-white",
  pingClasses = "bg-red-600 animate-ping opacity-25",
  textClasses = "text-xl",
  showPressText = true,
  userLocation = null
}) => {
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const user = useSelector((state) => state.auth?.user);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const getPersonalContacts = () => {
    const saved = localStorage.getItem("evsync_emergency_contacts");
    return saved ? JSON.parse(saved) : [];
  };

  const handleSOSClick = () => {
    const contacts = getPersonalContacts();
    if (contacts.length === 0) {
      toast.error("No emergency contacts found! Please add them in the Emergency page.");
      return;
    }
    setShowTypeModal(true);
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

  const dispatchSOS = async (type, locationCoords) => {
    const contacts = getPersonalContacts();
    const toastId = toast.loading(`Sending ${type} Alert...`);

    const locStr = locationCoords ? `https://www.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}` : "Location tracking is currently OFF or unavailable.";

    try {
      const response = await fetch(`${backendURL}/api/emergency/send-sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: contacts,
          locationMessage: locStr,
          userName: user?.name || user?.fullName || "A user",
          emergencyType: type,
          userLat: locationCoords?.lat,
          userLng: locationCoords?.lng
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
      const primary = contacts.find(c => c.relation === "Primary") || contacts[0];
      if (primary) handleSMSFallback(primary, type, locationCoords);
    }
  };

  const confirmSOS = async (type) => {
    setShowTypeModal(false);

    if (userLocation) {
      dispatchSOS(type, userLocation);
      return;
    }

    // Try to get location on demand
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dispatchSOS(type, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error("Location error:", err);
          dispatchSOS(type, null);
        },
        // enableHighAccuracy: false makes it instantly fallback to IP/WiFi location on desktop
        // which prevents the timeout from failing the SOS payload!
        { enableHighAccuracy: false, timeout: 15000, maximumAge: Infinity }
      );
    } else {
      dispatchSOS(type, null);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSOSClick}
          className={`fixed bottom-6 right-6 rounded-full flex flex-col items-center justify-center z-[90] group ${buttonClasses}`}
        >
          <div className={`absolute inset-0 rounded-full ${pingClasses}`}></div>
          <span className={`font-black tracking-tighter ${textClasses}`}>SOS</span>
          {showPressText && <span className="text-[8px] font-bold uppercase tracking-widest">Press</span>}
        </motion.button>
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
    </>
  );
};

export default GlobalSOSButton;
