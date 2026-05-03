import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Navigation, Zap, Users, Leaf, ShieldCheck, HardHat } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  loginWithGoogle,
  resetOtpState,
  sendOtp,
  verifyOtp,
} from "../features/auth/authSlice";
import {
  selectAuthLoading,
  selectIsAuthenticated,
  selectUser,
} from "../features/auth/authSelectors";

/**
 * LoginPage Component
 * A premium redesign matching the requested UI specifications.
 */
const LoginPage = ({ role }) => {
  const [view, setView] = useState("login"); // login | otp_verify
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [requestedRole, setRequestedRole] = useState(role || "user"); // user | station_owner | admin | operator


  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const mobile = `+91${phone}`;

  const handleGoogleSuccess = async (credentialResponse) => {
    const action = await dispatch(loginWithGoogle({ 
        credential: credentialResponse.credential,
        requestedRole 
    }));

    if (loginWithGoogle.fulfilled.match(action)) {
      toast.success("Login successful");
      return;
    }

    toast.error(action.payload || "Failed to log in with Google");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (phone.trim().length !== 10) {
      const message = "Enter a valid 10-digit phone number";
      setPhoneError(message);
      toast.error(message);
      return;
    }

    const action = await dispatch(sendOtp(mobile));

    if (sendOtp.fulfilled.match(action)) {
      setPhoneError("");
      setTimer(120);
      setView("otp_verify");
      toast.success("OTP sent successfully");
      return;
    }

    const message = action.payload || "Failed to send OTP";
    if (/mobile|number/i.test(message)) {
      setPhoneError(message);
    }
    toast.error(message);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.join("").length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    const action = await dispatch(
      verifyOtp({
        mobile,
        otp: otp.join(""),
        requestedRole
      })
    );

    if (verifyOtp.fulfilled.match(action)) {
      setPhoneError("");
      toast.success("OTP verified successfully");
      return;
    }

    const message = action.payload || "Failed to verify OTP";
    if (/mobile|number/i.test(message)) {
      setPhoneError(message);
      setView("login");
      setOtp(["", "", "", "", "", ""]);
      dispatch(resetOtpState());
    }
    toast.error(message);
  };


  const handleOtpChange = (index, value) => {
    if (Number.isNaN(Number(value)) && value !== "") return;
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

    const isNewUser = useSelector(state => state.auth.isNewUser);

    useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Role-based redirection logic
    if (user.role === "admin") {
        navigate("/admin", { replace: true });
    } else if (user.role === "station_owner") {
        if (isNewUser) {
            navigate("/profile", { replace: true });
        } else {
            navigate("/owner-dashboard", { replace: true });
        }
    } else if (user.role === "operator") {
        navigate("/operator-dashboard", { replace: true });
    } else {
        navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (view !== "otp_verify") {
      dispatch(resetOtpState());
    }
  }, [dispatch, view]);

  return (
    <div style={{
      backgroundImage: "url('/assets/login.png')",
      backgroundPosition: 'bottom 0% left 20%',
      backgroundRepeat: 'no-repeat'
    }} className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
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
      <main className="flex-grow shadow-xl rounded-xl overflow-hidden flex m-auto max-h-[80vh] flex-col lg:flex-row pt-24 lg:pt-0">
        
        {/* LEFT COMPONENT: Branding & Visuals */}
        <section className="hidden lg:flex w-1/2 flex-col bg-[#FBFCFE] bg-cover bg-center relative overflow-hidden">
          <div 
            className="absolute inset-0 z-0 opacity-100 mix-blend-multiply transition-opacity duration-1000"
            style={{ 
              backgroundImage: "url('/assets/login-bg.png')",
              backgroundSize: '100%',
              backgroundPosition: 'bottom -10% left 20%',
              backgroundRepeat: 'no-repeat'
            }}
          />

          <div className="z-10 h-full p-10">
            <h2 className="text-3xl font-black text-slate-800 leading-[1.1] mb-4">
              {requestedRole === 'admin' ? 'Global Network Control.' : 
               requestedRole === 'station_owner' ? 'Scale Your EV Business.' :
               requestedRole === 'operator' ? 'Efficient Station Operations.' :
               'Powering Journeys.'}<br />
              <span className="text-emerald-500">
                {requestedRole === 'admin' ? 'Intelligently.' : 
                 requestedRole === 'station_owner' ? 'Profitably.' :
                 requestedRole === 'operator' ? 'Seamlessly.' :
                 'Sustainably.'}
              </span>
            </h2>
            
            <p className="text-sm text-slate-600 mb-6 max-w-md font-medium leading-relaxed">
              {requestedRole === 'admin' ? 'Manage global infrastructure, verify station requests, and monitor network health from a unified command center.' : 
               requestedRole === 'station_owner' ? 'List your stations, track real-time revenue, and manage your operator team with high-performance tools.' :
               requestedRole === 'operator' ? 'Verify customer bookings, monitor charger status, and ensure maximum uptime for your assigned station.' :
               'Find, access and manage EV charging stations with ease. Plan smarter. Drive further.'}
            </p>

            <div className="space-y-8 mb-30">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-emerald-500">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {requestedRole === 'admin' ? 'Network Overview' : requestedRole === 'station_owner' ? 'Multi-Station Management' : requestedRole === 'operator' ? 'Booking Verification' : 'Find Nearby Stations'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {requestedRole === 'admin' ? 'Real-time monitoring of all charging nodes globally.' : 
                     requestedRole === 'station_owner' ? 'Manage all your charging locations from one dashboard.' :
                     requestedRole === 'operator' ? 'Scan customer QR codes and verify sessions instantly.' :
                     'Locate fast and reliable charging stations near you.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-emerald-500">
                  <Navigation size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {requestedRole === 'admin' ? 'Partner Verification' : requestedRole === 'station_owner' ? 'Revenue Analytics' : requestedRole === 'operator' ? 'Live Monitoring' : 'Plan Your Trip'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {requestedRole === 'admin' ? 'Streamlined approval workflow for new station owners.' : 
                     requestedRole === 'station_owner' ? 'Deep insights into occupancy and financial performance.' :
                     requestedRole === 'operator' ? 'Track live charger occupancy and energy usage data.' :
                     'Plan long trips with charging stops optimized for your EV.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-full border border-slate-100 bg-white shadow-sm text-emerald-500">
                  <Zap size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {requestedRole === 'admin' ? 'System Integrity' : requestedRole === 'station_owner' ? 'Operator Assignment' : requestedRole === 'operator' ? 'Uptime Control' : 'Real-time Updates'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {requestedRole === 'admin' ? 'Maintain high standards of service across the entire network.' : 
                     requestedRole === 'station_owner' ? 'Easily assign and manage on-site operators via email.' :
                     requestedRole === 'operator' ? 'Manage hardware health and report on-site technical issues.' :
                     'Get real-time availability, pricing and station status.'}
                  </p>
                </div>
              </div>
            </div>

          </div>


        </section>

        {/* RIGHT COMPONENT: Auth Form */}
        <section className="w-full lg:w-1/2 flex bg-white flex-col items-center justify-center py-10 relative">
          <div className="w-[480px] p-8 md:p-12 transition-all duration-500">
            
            {view === "login" ? (
              <>
              <h2 className="text-2xl font-bold text-center mb-2">
                  Welcome to EV<span className="text-emerald-500">Sync</span>
              </h2>
              <p className="text-center text-gray-500 mb-6">
                Login to continue as {requestedRole.replace('_', ' ')}
              </p>

              {/* Role Display (Non-interactive)
              <div className="flex items-center justify-center gap-3 mb-8 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="p-2 rounded-lg bg-emerald-500">
                  {requestedRole === 'admin' ? <ShieldCheck className="text-white w-5 h-5" /> : 
                   requestedRole === 'station_owner' ? <HardHat className="text-white w-5 h-5" /> :
                   requestedRole === 'operator' ? <Zap className="text-white w-5 h-5" /> :
                   <Users className="text-white w-5 h-5" />}
                </div>

                <h3 className="font-black text-slate-800 uppercase tracking-[0.1em]">
                  {requestedRole.replace('_', ' ')} <span className="text-slate-400 ml-1">Portal</span>
                </h3>
              </div> */}



              
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        toast.error("Google login failed");
                    }}
                />

              <div className="text-center text-gray-400 text-sm my-4">---------- OR ----------</div>

              <div className="flex gap-2 mb-4">
                  <div className="px-5 py-2 border border-black/10 bg-slate-50 rounded-lg font-bold text-slate-600">+91</div>
                  <input 
                      type="text"
                      placeholder="Enter mobile number"
                      className={`flex-1 border rounded-lg px-4 py-2 outline-none font-medium transition-all ${
                        phoneError
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-black/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      }`}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        if (phoneError) {
                          setPhoneError("");
                        }
                      }}
                  />
              </div>

              {phoneError && (
                <p className="mb-4 text-sm font-medium text-red-500">{phoneError}</p>
              )}

              <button 
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-[0.1em] hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
              >
                  {loading ? "Sending..." : "Send Secure OTP"}
              </button>



              <p className="text-xs text-center text-gray-500 mt-6 font-medium">
                By continuing, you agree to <span className="text-emerald-500 cursor-pointer">Terms</span> & <span className="text-emerald-500 cursor-pointer">Privacy Policy</span>
              </p>
              </>
            ) : (
            <>
                <button 
                  onClick={() => {
                    setView("login");
                    setOtp(["", "", "", "", "", ""]);
                    dispatch(resetOtpState());
                  }}
                  className="mb-6 p-2 rounded-full hover:bg-slate-100 transition-all"
                >
                <ArrowLeft size={20} />
                </button>

              <h2 className="text-xl font-bold text-center mb-2">
                Verify Your <span className="text-emerald-500">Number</span>
              </h2>

              <p className="text-center text-gray-500 mb-8 font-medium">
                Enter the 6-digit OTP sent to {mobile}
              </p>

              {/* OTP */}
              <div className="flex justify-between mb-8">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      value={digit}
                      maxLength={1}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-14 h-16 text-center border border-black/10 bg-slate-50 rounded-xl text-2xl font-bold focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    />
                  ))}
                </div>

              <p className="text-center text-sm text-gray-500 mb-6 font-medium">
                OTP expires in{" "}
                <span className="text-emerald-500 font-bold">
                  {timer}s
                </span>
              </p>

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-green-100 transition-all active:scale-95"
              >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>

              <p className="text-center text-sm mt-6 text-gray-500 font-medium">
                Didn’t receive OTP?{" "}
                <span
                  className="text-emerald-500 cursor-pointer font-bold hover:underline"
                  onClick={handleSendOTP}
                >
                  Resend
                </span>
              </p>
            </>
            )}
          </div>
        </section>
      </main>

      <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-green-50/50 to-transparent -z-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-green-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />
    </div>
  );
};

export default LoginPage;
