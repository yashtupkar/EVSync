import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Pencil, 
  ChevronDown, 
  Calendar, 
  Zap, 
  MapPin, 
  Navigation, 
  Users, 
  Leaf, 
  User, 
  Mail,
  Camera
} from "lucide-react";

/**
 * ProfilePage Component
 * Redesigned to match the premium UI of LoginPage.
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    gender: "",
    dob: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{
      backgroundImage: "url('/assets/login.png')",
      
      backgroundPosition: 'bottom 0% left 20%',
      backgroundRepeat: 'no-repeat'
    }}  className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
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
      <main className="flex-grow shadow-xl max-w-7xl rounded-xl overflow-hidden flex m-auto max-h-[80vh]   flex-col lg:flex-row pt-24 lg:pt-0">
        
        {/* LEFT COMPONENT: Branding & Visuals (Hidden on small screens) */}
        <section 
          className="hidden lg:flex w-1/2 flex-col bg-[#FBFCFE]  bg-cover bg-center relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 z-0 opacity-100 mix-blend-multiply transition-opacity duration-1000"
            style={{ 
              backgroundImage: "url('/assets/login-bg.png')",
              backgroundSize: '100%',
              backgroundPosition: 'bottom -10% left 20%',
              backgroundRepeat: 'no-repeat'
            }}
          />

          <div className="z-10 h-full p-10 ">
            <h2 className="text-3xl font-black text-slate-800 leading-[1.1] mb-4">
              Join the Green<br />
              <span className="text-[#1BAC4B]">Revolution.</span>
            </h2>
            
            <p className="text-sm text-slate-600 mb-8 max-w-md font-medium leading-relaxed">
              Your profile helps us personalize your charging experience and find the best routes for your specific vehicle.
            </p>

            {/* Feature List */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-[#1BAC4B]">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Personalized Experience</h3>
                  <p className="text-sm text-slate-500 font-medium">Get recommendations tailored to your<br />driving habits and location.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-[#1BAC4B]">
                  <ShieldCheck size={22} className="text-[#1BAC4B]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Secure & Private</h3>
                  <p className="text-sm text-slate-500 font-medium">Your data is encrypted and used only<br />to improve your journey.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-[#1BAC4B]">
                  <Leaf size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Carbon Tracking</h3>
                  <p className="text-sm text-slate-500 font-medium">See how much CO₂ you've saved<br />by switching to electric.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COMPONENT: Profile Form */}
        <section className="w-full lg:w-1/2 flex bg-white flex-col items-center justify-center  relative overflow-y-auto custom-scrollbar">
          <div className="w-full h-full max-w-[480px] p-4 md:p-8 transition-all duration-500">
            

            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Complete Your <span className="text-[#1BAC4B]">Profile</span>
            </h2>
            <p className="text-slate-500 mb-10 font-medium">
              Help us get to know you better for a better experience.
            </p>

            {/* Profile Image Section */}
            <div className="flex justify-center mb-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-[#1BAC4B] transition-colors relative">
                  <User className="w-16 h-16 text-slate-200" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <button className="absolute -bottom-2 -right-2 bg-[#1BAC4B] text-white p-2.5 rounded-xl shadow-lg hover:bg-[#189a43] transition-all transform hover:scale-110 active:scale-95">
                  <Camera size={18} />
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6 mb-8">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Full Name
                </label>
                <div className="flex items-center gap-3 px-4 py-3 border border-black/10 rounded-xl focus-within:border-[#1BAC4B] transition-colors bg-slate-50/50">
                  <User size={18} className="text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-4 py-3 border border-black/10 rounded-xl focus-within:border-[#1BAC4B] transition-colors bg-slate-50/50">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Gender and Birthday row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Gender
                  </label>
                  <div className="relative group">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:border-[#1BAC4B] outline-none text-slate-800 font-semibold appearance-none cursor-pointer transition-colors"
                    >
                      <option value="" disabled>Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Birthday
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 border border-black/10 rounded-xl focus-within:border-[#1BAC4B] transition-colors bg-slate-50/50">
                    <input
                      type="text"
                      name="dob"
                      placeholder="DD/MM/YYYY"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold placeholder:text-slate-300"
                    />
                    <Calendar size={18} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/vehicle-selection")}
              className="w-full py-4 bg-[#1BAC4B] text-white rounded-2xl font-bold text-lg hover:bg-[#189a43] transition-all shadow-xl shadow-green-100 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Finish Setup
            </button>
            
            <p className="text-center pb-10 text-xs text-slate-400 mt-6 px-4 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy regarding data handling.
            </p>
          </div>
        </section>
      </main>

      {/* --- BACKGROUND ACCENT (Decor) --- */}
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-green-50/50 to-transparent -z-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-green-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />
    </div>
  );
};

// Internal ShieldCheck component
const ShieldCheck = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default ProfilePage;
