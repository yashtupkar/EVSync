import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ChevronDown, 
  MapPin, 
  Navigation, 
  Zap, 
  Users, 
  Leaf, 
  Globe, 
  User, 
  Store, 
  ShieldCheck,
  Smartphone,
  Fingerprint,
  CheckCircle2
} from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

/**
 * LoginPage Component
 * A premium redesign matching the requested UI specifications.
 */
const LoginPage = () => {
  const [role, setRole] = useState("user"); // user | station_owner | admin
  const [authMethod, setAuthMethod] = useState("phone"); // phone | otp
  const [view, setView] = useState("login"); // login | otp_verify
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const mobile = "+91"+phone;

  const handleGoogleSuccess = async (credentialResponse)=>{
    try{
      const response = await axios.post(`${backendURL}/auth/google`,{
        credential:credentialResponse.credential
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      if(response.data.isNewUser){
        navigate('/profile', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      toast.success('Google Login successful');
    }catch(error){
          console.log('Google Login error',error);
          toast.error('Failed to log in with Google');
    }
  }

  const handleSendOTP = async(e)=>{
    e.preventDefault();
      try {
        const response = await axios.post(`${backendURL}/auth/login/phone`,{
          mobile,
        });
        setAuthMethod('otp');
        toast.success('OTP sent successfully');
        setView('otp_verify');
      } catch (error) {
        toast.error(error.message);
      }
  }

  const handleVerifyOTP = async(e)=>{
    e.preventDefault();
    try {
      const response = await axios.post(`${backendURL}/auth/login/phone/verify`,{
        mobile,
        otp:otp.join(""),
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      if(response.data.isNewUser){
        navigate('/profile', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      toast.success('OTP verified successfully');
      
    } catch (error) {
      toast.error(error.message);
    }
  }


  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  useEffect(() => {
    if (view === "otp_verify" && timer > 0) {
      const interval = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [view, timer]);

  // Prevent logged-in users from accessing login page
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{
      backgroundImage: "url('/assets/login.png')",
      
      backgroundPosition: 'bottom 0% left 20%',
      backgroundRepeat: 'no-repeat'
    }} className="min-h-screen bg-white flex  flex-col font-sans text-slate-900">
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
      <main className="flex-grow shadow-xl rounded-xl overflow-hidden  flex  m-auto max-h-[80vh] flex-col lg:flex-row pt-24 lg:pt-0">
        
        {/* LEFT COMPONENT: Branding & Visuals */}
        <section 
          className="hidden lg:flex w-1/2 flex-col bg-[#FBFCFE]  bg-cover bg-center relative overflow-hidden"
        >
          {/* Background Illustration Container */}
          <div 
            className="absolute inset-0 z-0 opacity-100 mix-blend-multiply transition-opacity duration-1000"
            style={{ 
              backgroundImage: "url('/assets/login-bg.png')",
              backgroundSize: '100%',
              backgroundPosition: 'bottom -10% left 20%',
              backgroundRepeat: 'no-repeat'
            }}
          />

          <div className=" z-10 h-full p-10 ">
            <h2 className="text-3xl font-black text-slate-800 leading-[1.1] mb-4">
              Powering Journeys.<br />
              <span className="text-[#1BAC4B]">Sustainably.</span>
            </h2>
            
            <p className="text-sm text-slate-600 mb-6 max-w-md font-medium leading-relaxed">
              Find, access and manage EV charging stations with ease. Plan smarter. Drive further.
            </p>

            {/* Feature List */}
            <div className="space-y-8 mb-30 ">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-[#1BAC4B]">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Find Nearby Stations</h3>
                  <p className="text-sm text-slate-500 font-medium">Locate fast and reliable charging<br />stations near you.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-[#1BAC4B]">
                  <Navigation size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Plan Your Trip</h3>
                  <p className="text-sm text-slate-500 font-medium">Plan long trips with charging stops<br />optimized for your EV.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-[#1BAC4B]">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Real-time Updates</h3>
                  <p className="text-sm text-slate-500 font-medium">Get real-time availability, pricing<br />and station status.</p>
                </div>
              </div>
            </div>

            {/* Bottom Stats Card */}
            <div className="bg-white hidden border border-white/40 p-4 rounded-xl shadow-2xl shadow-green-100/50 flex items-center justify-between gap-4 max-w-lg">
              <div className="flex  items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#1BAC4B]">
                  <Users size={20} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-800">50K+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Happy Users</p>
                </div>
              </div>
              <div className="h-12 w-px bg-slate-200/50"></div>
              <div className="flex  items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#1BAC4B]">
                  <Zap size={20} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-800">10K+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Charging Stations</p>
                </div>
              </div>
              <div className="h-12 w-px bg-slate-200/50"></div>
              <div className="flex  items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#1BAC4B]">
                  <Leaf size={20} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-800">120K+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tons CO₂ Saved</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COMPONENT: Auth Form */}
        <section className="w-full lg:w-1/2 flex bg-white flex-col items-center justify-center  py-10 relative">
          {/* Modern Card Container */}
          <div className="w-[480px]   p-8 md:p-12 transition-all duration-500">
            
            {view === "login" ? (
              <>
              <h2 className="text-2xl font-bold text-center mb-2">
                  Welcome to   EV<span className="text-[#1BAC4B]">Sync</span>
                  </h2>
              <p className="text-center text-gray-500 mb-6">
                Login to continue
              </p>

              {/* Role Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button className="flex-1 bg-white shadow rounded-lg py-2 text-sm font-semibold">
                  User
                  </button>
                <button className="flex-1 py-2 text-sm text-gray-500">
                  Station Owner
                  </button>
                <button className="flex-1 py-2 text-sm text-gray-500">
                  Admin
                  </button>
                </div>
                <div className="text-center text-gray-400 text-sm my-4">-------- Login with --------</div>

              {/* Google Login
              <button className="w-full border border-black/20 rounded-xl py-3 mb-4 flex justify-center gap-2 items-center hover:bg-gray-50">
                    <img 
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  className="w-5"
                    />
                    Continue with Google
                  </button> */}

                     <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => { console.log('Login Failed'); }}
          />

              <div className="text-center text-gray-400 text-sm my-4">---------- OR ----------</div>

              {/* Phone */}
              <div className="flex gap-2 mb-4">
                  <div className="px-5 py-2 border border-black/20 rounded-lg">+91</div>
                    <input 
                  type="text"
                      placeholder="Enter mobile number"
                  className="flex-1 border border-black/20 rounded-lg px-4"
                  value={phone}
                  onChange={(e)=>setPhone(e.target.value)}
                    />
                  </div>

                  <button 
                onClick={handleSendOTP}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700"
                  >
                    Send OTP
                  </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By continuing, you agree to Terms & Privacy Policy
                  </p>
              </>
            ) : (
            <>
                <button 
                  onClick={() => setView("login")}
                className="mb-4"
                >
                <ArrowLeft />
                </button>

              <h2 className="text-xl font-bold text-center mb-2">
                Verify Your <span className="text-green-600">Number</span>
                  </h2>

              <p className="text-center text-gray-500 mb-6">
                Enter the 6-digit OTP
              </p>

              {/* OTP */}
              <div className="flex justify-between mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      value={digit}
                      maxLength={1}
                    onChange={(e) =>
                      handleOtpChange(i, e.target.value)
                    }
                    className="w-14 h-14 text-center  border border-black/20 rounded-lg text-xl font-bold focus:border-green-600 outline-none"
                    />
                  ))}
                </div>

              <p className="text-center text-sm text-gray-500 mb-4">
                OTP expires in{" "}
                <span className="text-green-600 font-semibold">
                  {timer}s
                </span>
                  </p>

              <button onClick={handleVerifyOTP} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">
                  Verify & Continue
                </button>

              <p className="text-center text-sm mt-4 text-gray-500">
                Didn’t receive OTP?{" "}
                <span className="text-green-600 cursor-pointer">
                  Resend
                </span>
                  </p>
            </>
            )}
          </div>

          <div className="mt-auto pt-12 text-center lg:hidden">
             {/* Small stats for mobile view can go here if needed */}
          </div>
        </section>
      </main>

      {/* --- BACKGROUND ACCENT (Decor) --- */}
      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-green-50/50 to-transparent -z-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-green-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />
    </div>
  );
};

export default LoginPage;