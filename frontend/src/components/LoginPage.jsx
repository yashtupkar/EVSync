// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ArrowLeft, ChevronDown } from "lucide-react";

// const LoginPage = () => {
//   const navigate = useNavigate();
//   const [view, setView] = useState("social"); // 'social', 'phone', or 'otp'
//   const [otp, setOtp] = useState(["", "", "", ""]);
//   const [timer, setTimer] = useState(48);

//   const handleBack = () => {
//     if (view === "otp") {
//       setView("phone");
//     } else if (view === "phone") {
//       setView("social");
//     } else {
//       navigate("/");
//     }
//   };

//   const handleOtpChange = (index, value) => {
//     if (isNaN(value)) return;
//     const newOtp = [...otp];
//     newOtp[index] = value.substring(value.length - 1);
//     setOtp(newOtp);

//     // Move to next input if value is entered
//     if (value && index < 3) {
//       const nextInput = document.getElementById(`otp-${index + 1}`);
//       nextInput?.focus();
//     }
//   };

//   const handleKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       const prevInput = document.getElementById(`otp-${index - 1}`);
//       prevInput?.focus();
//     }
//   };

//   React.useEffect(() => {
//     let interval;
//     if (view === "otp" && timer > 0) {
//       interval = setInterval(() => {
//         setTimer((prev) => prev - 1);
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [view, timer]);

//   return (
//     <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center p-6 sm:p-12 transition-all duration-300">
//       {/* Top Header Section */}
//       <div className="w-full max-w-md flex items-center mb-8">
//         <button
//           onClick={handleBack}
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//         >
//           <ArrowLeft size={24} />
//         </button>
//       </div>

//       <div className="w-full max-w-md flex flex-col items-center">
//         {view === "social" ? (
//           <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
//             {/* Illustration Placeholder - More compact */}
//             <div className="w-full flex justify-center mb-6">
//               <svg
//                 width="200"
//                 height="160"
//                 viewBox="0 0 240 200"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="w-40 h-32 sm:w-48 sm:h-40"
//               >
//                 <circle cx="120" cy="100" r="80" fill="#F3F4F6" />
//                 <path
//                   d="M160 140C160 140 170 120 180 120C190 120 200 140 200 140"
//                   stroke="#1BAC4B"
//                   strokeWidth="12"
//                   strokeLinecap="round"
//                 />
//                 <circle cx="170" cy="60" r="15" fill="#1BAC4B" opacity="0.6" />
//                 <rect
//                   x="90"
//                   y="60"
//                   width="40"
//                   height="80"
//                   rx="4"
//                   fill="#D1D5DB"
//                 />
//                 <path d="M95 100H125" stroke="white" strokeWidth="2" />
//                 <path d="M95 110H125" stroke="white" strokeWidth="2" />
//                 <path d="M110 75V125" stroke="white" strokeWidth="2" />
//                 <circle cx="115" cy="150" r="10" fill="#374151" />
//                 <path
//                   d="M100 160L130 190"
//                   stroke="#374151"
//                   strokeWidth="4"
//                   strokeLinecap="round"
//                 />
//               </svg>
//             </div>

//             <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8">
//               Let's you in
//             </h1>

//             <div className="w-full space-y-3 mb-6">
//               {/* Social Buttons - More compact */}
//               <button className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base">
//                 <img
//                   src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
//                   alt="Google"
//                   className="w-5 h-5"
//                 />
//                 <span>Continue with Google</span>
//               </button>

//               <button className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base">
//                 <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
//                   <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
//                 </svg>
//                 <span className="text-gray-800">Continue with Facebook</span>
//               </button>

//               <button className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-sm sm:text-base">
//                 <svg
//                   viewBox="0 0 24 24"
//                   width="20"
//                   height="20"
//                   fill="currentColor"
//                 >
//                   <path d="M17.05 20.28c-.98.95-2.05 1.72-3.21 2.31-1.16.59-2.39.88-3.69.88-1.3 0-2.53-.29-3.69-.88-1.16-.59-2.23-1.36-3.21-2.31-1.84-1.78-2.76-4.04-2.76-6.78 0-2.74.92-5 2.76-6.78.98-.95 2.05-1.72 3.21-2.31 1.16-.59 2.39-.88 3.69-.88 1.3 0 2.53.29 3.69.88 1.16.59 2.23 1.36 3.21 2.31 1.84 1.78 2.76 4.04 2.76 6.78 0 2.74-.92 5-2.76 6.78zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
//                 </svg>
//                 <span>Continue with Apple</span>
//               </button>
//             </div>

//             <div className="w-full flex items-center gap-4 py-4">
//               <div className="flex-grow h-px bg-gray-200"></div>
//               <span className="text-gray-400 text-sm font-medium">or</span>
//               <div className="flex-grow h-px bg-gray-200"></div>
//             </div>

//             <button
//               onClick={() => setView("phone")}
//               className="w-full py-4 bg-[#1BAC4B] text-white rounded-full font-bold text-base sm:text-lg hover:bg-[#189a43] transition-all shadow-lg shadow-green-100 mb-8"
//             >
//               Sign in with Phone Number
//             </button>

//             <div className="text-center text-gray-500 text-sm font-medium">
//               Don't have an account?{" "}
//               <button className="text-[#1BAC4B] font-bold hover:underline ml-1">
//                 Sign up
//               </button>
//             </div>
//           </div>
//         ) : view === "phone" ? (
//           <div className="w-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
//             <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//               Hello there <span className="animate-wave">👋</span>
//             </h1>
//             <p className="text-gray-500 text-base leading-relaxed mb-10">
//               Please enter your phone number. You will receive an OTP code in
//               the next step for the verification process.
//             </p>

//             <div className="w-full space-y-8 mb-auto">
//               <div>
//                 <label className="block text-sm font-bold text-gray-800 mb-4">
//                   Phone Number
//                 </label>
//                 <div className="flex items-center gap-3 pb-3 border-b-2 border-[#1BAC4B]">
//                   <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
//                     <img
//                       src="https://flagcdn.com/us.svg"
//                       alt="US"
//                       className="w-6 h-4 object-cover rounded-sm"
//                     />
//                     <ChevronDown size={16} className="text-gray-400" />
//                   </div>
//                   <span className="text-lg font-semibold text-gray-800">
//                     +1
//                   </span>
//                   <input
//                     type="tel"
//                     placeholder="111 467 378 399"
//                     className="flex-grow bg-transparent border-none outline-none text-lg font-semibold text-gray-800 placeholder:text-gray-300"
//                     autoFocus
//                   />
//                 </div>
//               </div>

//               <div className="flex items-start gap-3">
//                 <div className="mt-1">
//                   <input
//                     type="checkbox"
//                     id="terms"
//                     className="w-5 h-5 rounded-md border-2 border-[#1BAC4B] text-[#1BAC4B] focus:ring-[#1BAC4B] cursor-pointer accent-[#1BAC4B]"
//                     defaultChecked
//                   />
//                 </div>
//                 <label
//                   htmlFor="terms"
//                   className="text-sm font-medium text-gray-700 leading-snug cursor-pointer"
//                 >
//                   I agree to EVPoint{" "}
//                   <span className="text-[#1BAC4B] font-bold">
//                     Public Agreement
//                   </span>
//                   , <span className="text-[#1BAC4B] font-bold">Terms</span>,{" "}
//                   <span className="text-[#1BAC4B] font-bold">
//                     Privacy Policy
//                   </span>
//                   , and confirm that I am over 17 years old.
//                 </label>
//               </div>
//             </div>

//             <div className="fixed bottom-10 left-0 right-0 px-6 sm:relative sm:bottom-0 sm:px-0 sm:mt-12">
//               <button
//                 onClick={() => setView("otp")}
//                 className="w-full py-4 bg-[#1BAC4B] text-white rounded-full font-bold text-lg hover:bg-[#189a43] transition-all shadow-lg shadow-green-100"
//               >
//                 Continue
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className="w-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
//             <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//               OTP code verification 🔐
//             </h1>
//             <p className="text-gray-500 text-base leading-relaxed mb-12">
//               We have sent an OTP code to phone number ••• ••• ••• ••99. Enter
//               the OTP code below to continue.
//             </p>

//             <div className="flex justify-between gap-4 mb-12">
//               {otp.map((digit, index) => (
//                 <input
//                   key={index}
//                   id={`otp-${index}`}
//                   type="text"
//                   maxLength="1"
//                   value={digit}
//                   onChange={(e) => handleOtpChange(index, e.target.value)}
//                   onKeyDown={(e) => handleKeyDown(index, e)}
//                   className={`w-16 h-16 sm:w-20 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all outline-none ${
//                     digit
//                       ? "border-[#1BAC4B] bg-green-50/50"
//                       : "border-transparent bg-black/5"
//                   }`}
//                   autoFocus={index === 0}
//                 />
//               ))}
//             </div>

//             <div className="flex flex-col items-center gap-6">
//               <p className="text-gray-600 font-medium">Didn't receive code?</p>
//               <p className="text-gray-800 font-medium">
//                 You can resend code in{" "}
//                 <span className="text-[#1BAC4B] font-bold">{timer} s</span>
//               </p>
//             </div>

//             <div className="fixed bottom-10 left-0 right-0 px-6 sm:relative sm:bottom-0 sm:px-0 sm:mt-16">
//               <button
//                 onClick={() => navigate("/profile")}
//                 className="w-full py-4 bg-[#1BAC4B] text-white rounded-full font-bold text-lg hover:bg-[#189a43] transition-all shadow-lg shadow-green-100"
//               >
//                 Verify
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LoginPage;


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
                <div className="text-center text-gray-400 text-sm mb-4">-------- login with --------</div>

              {/* Google Login */}
              <button className="w-full border border-black/20 rounded-xl py-3 mb-4 flex justify-center gap-2 items-center hover:bg-gray-50">
                    <img 
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  className="w-5"
                    />
                    Continue with Google
                  </button>

              <div className="text-center text-gray-400 text-sm mb-4">---------- or ----------</div>

              {/* Phone */}
              <div className="flex gap-2 mb-4">
                  <div className="px-5 py-3 border border-black/20 rounded-xl">+91</div>
                    <input 
                  type="text"
                      placeholder="Enter mobile number"
                  className="flex-1 border border-black/20 rounded-xl px-4"
                    />
                  </div>

                  <button 
                onClick={() => setView("otp")}
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

              <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">
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