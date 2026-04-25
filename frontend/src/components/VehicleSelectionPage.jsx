import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight,
  Search, 
  ChevronDown, 
  Zap, 
  Target, 
  Map,
  Car,
  Calendar,
  Info,
  CheckCircle2,
  Bike,
  Truck
} from "lucide-react";
import evData from "../../data/ev-data.json";

/**
 * VehicleSelectionPage Component
 * Integrated with Indian EV Dataset.
 */
const VehicleSelectionPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("search"); // search | manual
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState("car");
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedModelName, setSelectedModelName] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Derived Data
  const categories = evData.meta.categories;
  
  // Filter brands based on category
  const brandsInCategory = evData.brands.filter(brand => 
    evData.data.some(v => v.brand_id === brand.id && v.vehicle_type === selectedCategory)
  );

  // Filter models based on brand and category
  const vehiclesOfBrandAndCategory = evData.data.filter(v => 
    v.brand_id === selectedMakeId && v.vehicle_type === selectedCategory
  );
  
  // Unique model names for the selected brand
  const modelNames = [...new Set(vehiclesOfBrandAndCategory.map(v => v.model))];

  // Variants for the selected model
  const variants = vehiclesOfBrandAndCategory.filter(v => v.model === selectedModelName);

  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = evData.data.find(v => v.id === selectedVehicleId);
      setSelectedVehicle(vehicle);
      setShowPreview(true);
    } else {
      setSelectedVehicle(null);
      setShowPreview(false);
    }
  }, [selectedVehicleId]);

  const getVehicleImage = (vehicle) => {
    if (!vehicle) return "/assets/login.png";
    const type = vehicle.vehicle_type;
    switch(type) {
      case "car": return "/assets/ev-images/car2.png";
      case "scooter": return "/assets/ev-images/scooter3.png";
      case "three_wheeler":
      case "rickshaw":
        return "/assets/ev-images/scooter2.png"; // Fallback to scooter if specific 3w image is missing
      default: return "/assets/ev-images/car.png";
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      // Logic to save vehicle and navigate
      localStorage.setItem("userVehicle", JSON.stringify(selectedVehicle));
      navigate("/");
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case "car": return <Car size={18} />;
      case "scooter": return <Bike size={18} />;
      case "three_wheeler": 
      case "rickshaw": return <Truck size={18} />;
      default: return <Car size={18} />;
    }
  };

  return (
    <div style={{
      backgroundImage: "url('/assets/login.png')",
      backgroundSize: '100%',
      backgroundPosition: 'bottom -10% left 0%',
      backgroundRepeat: 'no-repeat'
    }} className="min-h-screen bg-white flex flex-col font-sans text-slate-900 overflow-x-hidden">
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="bg-[#1BAC4B] p-2 rounded-xl shadow-lg shadow-green-100 flex items-center justify-center">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-none">
              EV<span className="text-[#1BAC4B]">Sync</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
              Smart Locater
            </p>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <main className="flex-grow flex max-w-5xl m-auto flex-col lg:flex-row max-h-[80vh] shadow-xl rounded-xl overflow-hidden mt-20 mb-10">
        
        {/* LEFT COMPONENT: Branding & Visuals */}
        <section className="hidden lg:flex w-[40%] flex-col bg-[#FBFCFE] relative overflow-hidden p-12">
          {/* Background Illustration Container */}
          <div 
            className="absolute inset-0 z-0 opacity-100 mix-blend-multiply"
            style={{ 
              backgroundImage: "url('/assets/login-bg.png')",
              backgroundSize: '100%',
              backgroundPosition: 'bottom -10% left 20%',
              backgroundRepeat: 'no-repeat'
            }}
          />

          <div className="z-10 flex flex-col max-w-sm mx-auto mb-12">
            <h2 className="text-3xl font-black text-slate-800 leading-[1.1] mb-4">
              Select Your <span className="text-[#1BAC4B]">Vehicle</span>
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Add your EV to get personalized charging recommendations, accurate range & better trip planning.
            </p>
          </div>

          {/* Feature List */}
          <div className="z-10 space-y-6 max-w-xs">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-white shadow-sm text-[#1BAC4B]">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Accurate Range</h3>
                <p className="text-[11px] text-slate-500 font-medium">See real-time range based on your vehicle</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-white shadow-sm text-[#1BAC4B]">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Smart Recommendations</h3>
                <p className="text-[11px] text-slate-500 font-medium">Get compatible stations & best suggestions</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-white shadow-sm text-[#1BAC4B]">
                <Map size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Better Trip Planning</h3>
                <p className="text-[11px] text-slate-500 font-medium">Plan long trips with confidence</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COMPONENT: Vehicle Selection Form */}
        <section className="w-full lg:w-[60%] flex bg-white flex-col items-center py-10 px-4 lg:px-10 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Add Your Vehicle (Optional)</h2>
              <p className="text-slate-500 text-sm">You can add or change it later from settings.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-10">
              <button 
                onClick={() => setTab("search")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold ${
                  tab === "search" 
                  ? "border-[#1BAC4B] text-[#1BAC4B] bg-green-50/30" 
                  : "border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <Search size={18} />
                Search Vehicle
              </button>
              <button 
                onClick={() => setTab("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-semibold ${
                  tab === "manual" 
                  ? "border-[#1BAC4B] text-[#1BAC4B] bg-green-50/30" 
                  : "border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <Car size={18} />
                Enter Manually
              </button>
            </div>

            {/* Selection Grid or Manual Form */}
            {tab === "search" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in slide-in-from-bottom-2 duration-300">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1BAC4B] transition-colors">
                      {getCategoryIcon(selectedCategory)}
                    </div>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedMakeId("");
                        setSelectedModelName("");
                        setSelectedVehicleId("");
                      }}
                      className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl appearance-none focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.replace('_', ' ').charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Make Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Make</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1BAC4B] transition-colors">
                      <CheckCircle2 size={18} />
                    </div>
                    <select 
                      value={selectedMakeId}
                      onChange={(e) => {
                        setSelectedMakeId(e.target.value);
                        setSelectedModelName("");
                        setSelectedVehicleId("");
                      }}
                      className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl appearance-none focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700"
                    >
                      <option value="" disabled>Choose Brand</option>
                      {brandsInCategory.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Model</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1BAC4B] transition-colors">
                      <Zap size={18} />
                    </div>
                    <select 
                      value={selectedModelName}
                      onChange={(e) => {
                        setSelectedModelName(e.target.value);
                        setSelectedVehicleId("");
                      }}
                      disabled={!selectedMakeId}
                      className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl appearance-none focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                    >
                      <option value="" disabled>Choose Model</option>
                      {modelNames.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Variant Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Variant</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1BAC4B] transition-colors">
                      <Target size={18} />
                    </div>
                    <select 
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      disabled={!selectedModelName}
                      className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl appearance-none focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                    >
                      <option value="" disabled>Choose Variant</option>
                      {variants.map(v => (
                        <option key={v.id} value={v.id}>{v.variant || "Standard"}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 mb-8 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. My Awesome EV" 
                      className="w-full px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Battery Capacity (kWh)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 40" 
                      className="w-full px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Range (km)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 300" 
                      className="w-full px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Charger Type</label>
                    <div className="relative group">
                      <select className="w-full px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl appearance-none focus:border-[#1BAC4B] focus:ring-4 focus:ring-green-50 outline-none transition-all font-semibold text-slate-700">
                        <option>CCS2 (Most Common)</option>
                        <option>Type 2 (AC)</option>
                        <option>CHAdeMO</option>
                        <option>GB/T</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Card */}
            {showPreview && selectedVehicle && (
              <div className="animate-in fade-in zoom-in duration-300 mb-8">
                <div className="relative bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-8 ">
                  <div className="w-48 relative flex items-center justify-center ">
                    <img 
                      src={getVehicleImage(selectedVehicle)} 
                      alt="Selected Vehicle" 
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-black text-slate-800">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                      <span className="px-2 py-0.5 bg-green-50 text-[#1BAC4B] text-[10px] font-bold rounded-md uppercase">{selectedVehicle.release_year}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Battery</span>
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <Zap size={14} className="text-[#1BAC4B]" />
                          <span className="text-sm">{selectedVehicle.usable_battery_size_kwh} kWh</span>
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-slate-100 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Range</span>
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <Target size={14} className="text-[#1BAC4B]" />
                          <span className="text-sm">{selectedVehicle.range_km} km</span>
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-slate-100 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Port</span>
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <Info size={14} className="text-[#1BAC4B]" />
                          <span className="text-sm">{selectedVehicle.dc_charger?.ports[0] || selectedVehicle.ac_charger?.ports[0] || "Type 2"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Banner */}
            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex items-start gap-3 mb-10">
              <div className="mt-0.5 text-[#1BAC4B]">
                <Zap size={18} className="fill-[#1BAC4B]" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                We'll use this information to show accurate range, compatible stations and trip suggestions.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button 
                onClick={handleContinue}
                disabled={!selectedVehicle}
                className="flex-grow flex items-center justify-center gap-2 py-4 bg-[#1BAC4B] text-white rounded-2xl font-bold text-lg hover:bg-[#189a43] transition-all shadow-lg shadow-green-100 group disabled:opacity-50"
              >
                Continue
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- BACKGROUND ACCENT (Decor) --- */}
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-green-50/50 to-transparent -z-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-green-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />
    </div>
  );
};

export default VehicleSelectionPage;


