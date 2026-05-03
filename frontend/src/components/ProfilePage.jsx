import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  Camera,
  Phone,
  CheckCircle2
} from "lucide-react";
import { updateUserProfile, sendOtp } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import axios from "axios";

const backendURL = import.meta.env.VITE_BACKEND_URL;
const normalizeMobileForInput = (value = "") => value.replace(/^\+91/, "");

/**
 * ProfilePage Component
 * Redesigned to match the premium UI of LoginPage.
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    gender: user?.gender || "",
    dob: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    mobile: normalizeMobileForInput(user?.mobile || "")
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  // OTP States
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(!!user?.mobile);
  const [verifying, setVerifying] = useState(false);
  const [mobileError, setMobileError] = useState("");

  const mobileNumber = formData.mobile ? `+91${formData.mobile}` : "";

  const isGoogleUser = !!user?.googleId;

  const handleInputChange = (e) => {
    const { name } = e.target;
    const value = name === "mobile"
      ? e.target.value.replace(/\D/g, "").slice(0, 10)
      : e.target.value;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "mobile" && mobileError) {
      setMobileError("");
    }
    
    if (name === "mobile" && isGoogleUser) {
      setIsMobileVerified(value === normalizeMobileForInput(user?.mobile) && !!value);
      setIsOtpSent(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.mobile || formData.mobile.length < 10) {
      const message = "Please enter a valid mobile number";
      setMobileError(message);
      toast.error(message);
      return;
    }
    
    try {
      setVerifying(true);
      await dispatch(sendOtp(mobileNumber)).unwrap();
      setMobileError("");
      setIsOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (err) {
      if (typeof err === "string" && /mobile|number/i.test(err)) {
        setMobileError(err);
      }
      toast.error(err || "Failed to send OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      setVerifying(true);
      const response = await axios.post(`${backendURL}/auth/verify-only`, {
        mobile: mobileNumber,
        otp: otp
      });

      if (response.data.success) {
        setIsMobileVerified(true);
        setIsOtpSent(false);
        toast.success("Mobile number verified!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (isGoogleUser && !isMobileVerified) {
      toast.error("Please verify your mobile number first");
      return;
    }

    const data = new FormData();
    data.append("name", formData.fullName);
    data.append("email", formData.email);
    data.append("gender", formData.gender);
    data.append("dateOfBirth", formData.dob);
    data.append("mobile", mobileNumber);
    if (avatarFile) {
      data.append("avatar", avatarFile);
    }

    try {
      await dispatch(updateUserProfile(data)).unwrap();
      setMobileError("");
      toast.success("Profile updated successfully!");
      if (user.role === 'station_owner') {
        navigate("/owner-dashboard");
      } else {
        navigate("/vehicle-selection");
      }
    } catch (err) {
      if (typeof err === "string" && /mobile|number/i.test(err)) {
        setMobileError(err);
      }
      toast.error(err || "Failed to update profile");
    }
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
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-green-100 flex items-center justify-center">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-none">
              EV<span className="text-emerald-500">Sync</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
              Smart Locater
            </p>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <main className="flex-grow shadow-xl max-w-7xl rounded-xl overflow-hidden flex m-auto max-h-[80vh] flex-col lg:flex-row pt-24 lg:pt-0">
        
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
              <span className="text-emerald-500">Revolution.</span>
            </h2>
            
            <p className="text-sm text-slate-600 mb-8 max-w-md font-medium leading-relaxed">
              Your profile helps us personalize your charging experience and find the best routes for your specific vehicle.
            </p>

            {/* Feature List */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-emerald-500">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Personalized Experience</h3>
                  <p className="text-sm text-slate-500 font-medium">Get recommendations tailored to your<br />driving habits and location.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-emerald-500">
                  <ShieldCheck size={22} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Secure & Private</h3>
                  <p className="text-sm text-slate-500 font-medium">Your data is encrypted and used only<br />to improve your journey.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-emerald-500">
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
              Complete Your <span className="text-emerald-500">Profile</span>
            </h2>
            <p className="text-slate-500 mb-6 font-medium">
              Help us get to know you better for a better experience.
            </p>

            {/* Profile Image Section */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-emerald-500 transition-colors relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-2 rounded-lg shadow-lg hover:bg-emerald-600 transition-all transform hover:scale-110"
                >
                  <Camera size={14} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Full Name
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 border border-black/10 rounded-xl focus-within:border-emerald-500 transition-colors bg-slate-50/50">
                  <User size={16} className="text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold placeholder:text-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className={`flex items-center gap-3 px-4 py-2.5 border border-black/10 rounded-xl transition-colors ${isGoogleUser ? 'bg-slate-100' : 'bg-slate-50/50 focus-within:border-emerald-500'}`}>
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isGoogleUser}
                    className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold placeholder:text-slate-300 text-sm disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Mobile Number
                </label>
                <div className="flex flex-col gap-2">
                  <div className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl transition-colors ${
                    mobileError
                      ? 'border-red-500 bg-red-50/40'
                      : !isGoogleUser
                        ? 'border-black/10 bg-slate-100'
                        : 'border-black/10 bg-slate-50/50 focus-within:border-emerald-500'
                  }`}>
                    <Phone size={16} className="text-slate-400" />
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="Mobile Number"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      disabled={!isGoogleUser}
                      className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold text-sm disabled:text-slate-500"
                    />
                    {isGoogleUser && isMobileVerified && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>

                  {mobileError && (
                    <p className="text-sm font-medium text-red-500">{mobileError}</p>
                  )}

                  {isGoogleUser && !isMobileVerified && (
                    <div className="flex flex-col gap-2">
                      {!isOtpSent ? (
                        <button onClick={handleSendOtp} disabled={verifying} className="text-[10px] font-bold text-emerald-500 self-end px-2 py-1 bg-green-50 rounded-lg">
                          {verifying ? "Sending..." : "Get OTP"}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-black/10 rounded-lg text-sm text-center font-bold"
                          />
                          <button onClick={handleVerifyOtp} disabled={verifying} className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold">
                            Verify
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Gender and Birthday row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Gender
                  </label>
                  <div className="relative group">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-black/10 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-semibold appearance-none cursor-pointer transition-colors text-sm"
                    >
                      <option value="" disabled>Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Birthday
                  </label>
                  <div className="flex items-center gap-3 px-4 py-2.5 border border-black/10 rounded-xl focus-within:border-emerald-500 transition-colors bg-slate-50/50">
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="flex-1 bg-transparent border-none outline-none text-slate-800 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || (isGoogleUser && !isMobileVerified)}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg disabled:bg-slate-300"
            >
              {loading ? "Updating..." : "Finish Setup"}
            </button>
            
            <p className="text-center pb-10 text-[10px] text-slate-400 mt-4 px-4 leading-relaxed">
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
