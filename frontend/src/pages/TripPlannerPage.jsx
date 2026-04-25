import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import MapComponent from "../components/MapComponent";
import {
  MapPin,
  Navigation,
  Zap,
  Battery,
  Clock,
  Share2,
  Plus,
  Minus,
  Target,
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  Leaf,
  Star,
  Car,
  Search,
  Loader2,
  History,
} from "lucide-react";

const TripPlannerPage = () => {
  const [stations, setStations] = useState([]);
  const [departureTime, setDepartureTime] = useState("9:00 AM");
  const [departureDate, setDepartureDate] = useState("May 21, 2024");

  // Location Search States
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);
  const [routeTrigger, setRouteTrigger] = useState(0);
  const [routeData, setRouteData] = useState(null);

  const debounceTimer = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveToRecent = (suggestion) => {
    const newRecent = [
      suggestion,
      ...recentSearches.filter((s) => s.place_id !== suggestion.place_id),
    ].slice(0, 5); // Keep last 5
    setRecentSearches(newRecent);
    localStorage.setItem("recent_searches", JSON.stringify(newRecent));
  };

  // Get user current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setFromLocation({ lat: latitude, lng: longitude });
          setFrom("Your Location");
        },
        (error) => {
          console.error("Error getting current location:", error);
        },
      );
    }
  }, []);

  const fetchSuggestions = useCallback(
    async (query, setSuggestions, setLoading) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        setLoading(true);
        try {
          // Bias results towards user location if available
          let biasParams = "";
          if (fromLocation) {
            const { lat, lng } = fromLocation;
            // Create a 50km bounding box around user
            const offset = 0.5;
            biasParams = `&viewbox=${lng - offset},${lat + offset},${lng + offset},${lat - offset}`;
          }

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=in${biasParams}`,
          );
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error("Error fetching locations:", error);
        } finally {
          setLoading(false);
        }
      }, 400); // 400ms debounce
    },
    [fromLocation],
  );

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stations");
        const data = await response.json();
        setStations(data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    fetchStations();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F8FAF9] flex flex-col font-sans overflow-x-hidden relative">
      {/* Click outside to close suggestions */}
      {(showFromSuggestions || showToSuggestions) && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => {
            setShowFromSuggestions(false);
            setShowToSuggestions(false);
          }}
        />
      )}

      <main className="p-4 flex flex-col gap-4 max-w-[1600px] mx-auto w-full relative z-50">
        <div className="flex gap-2 min-h-[800px]">
          {/* Left Sidebar - Plan Your Trip */}
          <aside className="w-90 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Plan Your Trip
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Find the best route and charging stops
                </p>
              </div>

              <div className="space-y-4 relative">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    From
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 z-10">
                      <div className="w-2 h-2 rounded-full border-2 border-green-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter start location..."
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-green-500/50 transition-all font-medium text-gray-900"
                      value={from}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        fetchSuggestions(
                          e.target.value,
                          setFromSuggestions,
                          setIsLoadingFrom,
                        );
                        setShowFromSuggestions(true);
                      }}
                      onFocus={() => setShowFromSuggestions(true)}
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      {isLoadingFrom && (
                        <Loader2
                          size={14}
                          className="animate-spin text-green-500"
                        />
                      )}
                    </div>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <ArrowRightLeft size={16} className="rotate-90" />
                    </button>

                    {/* From Suggestions Dropdown */}
                    {showFromSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] max-h-72 overflow-y-auto custom-scrollbar py-2">
                        {/* Current Location Quick Option */}
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-green-50 transition-all flex items-center gap-3 border-b border-gray-50"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setFromLocation({
                                    lat: pos.coords.latitude,
                                    lng: pos.coords.longitude,
                                  });
                                  setFrom("Your Location");
                                  setShowFromSuggestions(false);
                                },
                              );
                            }
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <Navigation size={14} fill="currentColor" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">
                              Current Location
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Using GPS
                            </div>
                          </div>
                        </button>

                        {fromSuggestions.length > 0
                          ? fromSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.place_id}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all flex items-start gap-3 border-b border-gray-50 last:border-none"
                                onClick={() => {
                                  setFrom(suggestion.display_name);
                                  setFromLocation({
                                    lat: parseFloat(suggestion.lat),
                                    lng: parseFloat(suggestion.lon),
                                  });
                                  saveToRecent(suggestion);
                                  setFromSuggestions([]);
                                  setShowFromSuggestions(false);
                                  setIsRouteCalculated(false);
                                }}
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                  <MapPin size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-gray-900 truncate">
                                    {suggestion.display_name.split(",")[0]}
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate">
                                    {suggestion.display_name
                                      .split(",")
                                      .slice(1)
                                      .join(",")
                                      .trim()}
                                  </div>
                                </div>
                              </button>
                            ))
                          : recentSearches.length > 0 &&
                            !isLoadingFrom && (
                              <div className="mt-2">
                                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Recent Searches
                                </div>
                                {recentSearches.map((suggestion) => (
                                  <button
                                    key={`recent-from-${suggestion.place_id}`}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all flex items-start gap-3 border-b border-gray-50 last:border-none"
                                    onClick={() => {
                                      setFrom(suggestion.display_name);
                                      setFromLocation({
                                        lat: parseFloat(suggestion.lat),
                                        lng: parseFloat(suggestion.lon),
                                      });
                                      saveToRecent(suggestion);
                                      setShowFromSuggestions(false);
                                      setIsRouteCalculated(false);
                                    }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                                      <History size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-gray-600 truncate">
                                        {suggestion.display_name.split(",")[0]}
                                      </div>
                                      <div className="text-[10px] text-gray-400 truncate">
                                        {suggestion.display_name
                                          .split(",")
                                          .slice(1)
                                          .join(",")
                                          .trim()}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                        {from.length >= 3 &&
                          fromSuggestions.length === 0 &&
                          !isLoadingFrom &&
                          recentSearches.length === 0 && (
                            <div className="px-4 py-6 text-center text-gray-400">
                              <Search
                                size={20}
                                className="mx-auto mb-2 opacity-20"
                              />
                              <div className="text-xs font-medium">
                                No locations found
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    To
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 z-10">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter destination..."
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-green-500/50 transition-all font-medium text-gray-900"
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value);
                        fetchSuggestions(
                          e.target.value,
                          setToSuggestions,
                          setIsLoadingTo,
                        );
                        setShowToSuggestions(true);
                      }}
                      onFocus={() => setShowToSuggestions(true)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isLoadingTo && (
                        <Loader2
                          size={14}
                          className="animate-spin text-red-500"
                        />
                      )}
                    </div>

                    {/* To Suggestions Dropdown */}
                    {showToSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] max-h-72 overflow-y-auto custom-scrollbar py-2">
                        {toSuggestions.length > 0
                          ? toSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.place_id}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all flex items-start gap-3 border-b border-gray-50 last:border-none"
                                onClick={() => {
                                  setTo(suggestion.display_name);
                                  setToLocation({
                                    lat: parseFloat(suggestion.lat),
                                    lng: parseFloat(suggestion.lon),
                                  });
                                  saveToRecent(suggestion);
                                  setToSuggestions([]);
                                  setShowToSuggestions(false);
                                  setIsRouteCalculated(false);
                                }}
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                  <MapPin size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-gray-900 truncate">
                                    {suggestion.display_name.split(",")[0]}
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate">
                                    {suggestion.display_name
                                      .split(",")
                                      .slice(1)
                                      .join(",")
                                      .trim()}
                                  </div>
                                </div>
                              </button>
                            ))
                          : recentSearches.length > 0 &&
                            !isLoadingTo && (
                              <div className="mt-2">
                                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Recent Searches
                                </div>
                                {recentSearches.map((suggestion) => (
                                  <button
                                    key={`recent-to-${suggestion.place_id}`}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all flex items-start gap-3 border-b border-gray-50 last:border-none"
                                    onClick={() => {
                                      setTo(suggestion.display_name);
                                      setToLocation({
                                        lat: parseFloat(suggestion.lat),
                                        lng: parseFloat(suggestion.lon),
                                      });
                                      saveToRecent(suggestion);
                                      setShowToSuggestions(false);
                                      setIsRouteCalculated(false);
                                    }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                                      <History size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-gray-600 truncate">
                                        {suggestion.display_name.split(",")[0]}
                                      </div>
                                      <div className="text-[10px] text-gray-400 truncate">
                                        {suggestion.display_name
                                          .split(",")
                                          .slice(1)
                                          .join(",")
                                          .trim()}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                        {to.length >= 3 &&
                          toSuggestions.length === 0 &&
                          !isLoadingTo &&
                          recentSearches.length === 0 && (
                            <div className="px-4 py-6 text-center text-gray-400">
                              <Search
                                size={20}
                                className="mx-auto mb-2 opacity-20"
                              />
                              <div className="text-xs font-medium">
                                No locations found
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical dotted line connecting From and To */}
                <div className="absolute left-[21px] top-[48px] bottom-[28px] w-[1px] border-l-2 border-dotted border-gray-200"></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Vehicle
                </label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl group hover:border-green-500/30 transition-all cursor-pointer">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">
                        Tesla Model 3
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Long Range
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-500">
                        78% Battery
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-[10px] text-gray-500">
                        286 km Range
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-8 flex items-center justify-center text-gray-400">
                    <Car size={24} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Trip Preferences
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center justify-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl group transition-all">
                    <Zap size={18} className="text-green-500" />
                    <span className="text-[10px] font-bold text-green-600">
                      Fastest
                    </span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-green-500/30 transition-all">
                    <Leaf size={18} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500">
                      Eco Route
                    </span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-green-500/30 transition-all">
                    <Target size={18} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500">
                      Fewer Stops
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Departure Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>May 21, 2024</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span>9:00 AM</span>
                    </div>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                className="w-full py-4 bg-[#1BAC4B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-[#189641] transition-all transform active:scale-[0.98]"
                onClick={() => {
                  if (fromLocation && toLocation) {
                    setIsRouteCalculated(true);
                    setRouteTrigger((prev) => prev + 1);
                  }
                }}
              >
                Plan Trip
              </button>
            </div>

            {/* Trip Summary Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Trip Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-green-500">
                    <Navigation size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Total Distance
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {routeData ? (routeData.distance / 1000).toFixed(1) + " km" : "---"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-blue-500">
                    <Clock size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Total Time (Est.)
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {routeData ? Math.floor(routeData.duration / 3600) + " h " + Math.round((routeData.duration % 3600) / 60) + " min" : "---"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-yellow-500">
                    <Zap size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Total Charging Time
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ~ 45 min
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-purple-500">
                    <Target size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Estimated Arrival
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      12:45 PM
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl flex items-center gap-3">
                <Clock size={14} className="text-green-500" />
                <span className="text-[10px] text-green-700 font-medium">
                  You will arrive with ~18% battery
                </span>
              </div>
            </div>
          </aside>

          {/* Map Area */}
          <section className="flex-grow h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border-4 border-white overflow-hidden relative">
            <div className="absolute inset-0">
              <MapComponent
                stations={stations}
                hideSearch={true}
                startLocation={useMemo(() => 
                  fromLocation ? [fromLocation.lat, fromLocation.lng] : null,
                [fromLocation])}
                destination={useMemo(() => 
                  toLocation
                    ? {
                        location: {
                          coordinates: [toLocation.lng, toLocation.lat],
                        },
                      }
                    : null,
                [toLocation])}
                showRoute={isRouteCalculated}
                routeTrigger={routeTrigger}
                usePaperPins={true}
                onRouteUpdate={(data) => setRouteData(data)}
              />
            </div>

            {/* Map Overlays */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 min-w-[140px]">
                  <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
                    Fastest Route
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    3 h 45 min
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    190 km
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/40 flex flex-col gap-1 min-w-[140px] opacity-80">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Eco Route
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    4 h 15 min
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    195 km
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/40 flex flex-col gap-1 min-w-[140px] opacity-80">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Fewer Stops
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    4 h 05 min
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    2 Stops
                  </div>
                </div>
              </div>
            </div>

            {/* Route Legend */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Selected Route
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Alternative Route
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                  <Zap size={6} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                  Charging Stop
                </span>
              </div>
            </div>
          </section>

          {/* Right Sidebar - Your Trip Itinerary */}
          <aside className="w-96 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Your Trip Itinerary
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {routeData?.instructions?.length ? `${Math.floor(routeData.instructions.length / 5)} Stops Suggested` : "Planning route..."}
                  </p>
                </div>
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all">
                  <Share2 size={14} /> Share Trip
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-2xl">
                <div className="text-center border-r border-gray-200">
                  <div className="text-sm font-bold text-gray-900">190 km</div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    Total Distance
                  </div>
                </div>
                <div className="text-center border-r border-gray-200">
                  <div className="text-sm font-bold text-gray-900">
                    3 h 45 min
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    Total Time
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-green-500">
                    ~ 45 min
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    Charging Time
                  </div>
                </div>
              </div>

              {/* Itinerary Timeline */}
              <div className="space-y-0 relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[7px] top-4 bottom-4 w-[2px] bg-gray-100"></div>

                {/* Start Point */}
                <div className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-green-500 shadow-sm z-10"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {from.split(',')[0] || "Start Point"}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Start
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-600">
                        78%
                      </span>
                      <Battery size={12} className="text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                    <Car size={12} />
                    <span>Drive {routeData ? (routeData.distance / 1000).toFixed(1) : "---"} km ({routeData ? Math.floor(routeData.duration / 3600) + " h " + Math.round((routeData.duration % 3600) / 60) + " min" : "---"})</span>
                  </div>
                </div>

                {/* Stop 1 */}
                <div className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-green-500 flex items-center justify-center text-[8px] text-white font-bold z-10 shadow-sm">
                    1
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-green-500/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        New Market EcoCharge
                      </h4>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold text-gray-900">
                          4.8
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3">
                      NH 46, Sehore, MP
                    </p>
                    <div className="inline-block px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg mb-4">
                      73 km from start
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-green-500" />
                        <div>
                          <div className="text-[10px] font-bold text-gray-900">
                            60 kW
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase font-black">
                            CCS2
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Battery size={14} className="text-green-500" />
                        <div>
                          <div className="text-[10px] font-bold text-gray-900">
                            Charge for ~20 min
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase font-black">
                            10% → 65%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                    <Car size={12} />
                    <span>Drive 64 km (1 h 15 min)</span>
                  </div>
                </div>

                {/* Stop 2 */}
                <div className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-green-500 flex items-center justify-center text-[8px] text-white font-bold z-10 shadow-sm">
                    2
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-green-500/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        Dewas Highway ChargeHub
                      </h4>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold text-gray-900">
                          4.4
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3">
                      NH 52, Dewas, MP
                    </p>
                    <div className="inline-block px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg mb-4">
                      137 km from start
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-green-500" />
                        <div>
                          <div className="text-[10px] font-bold text-gray-900">
                            60 kW
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase font-black">
                            CCS2
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Battery size={14} className="text-green-500" />
                        <div>
                          <div className="text-[10px] font-bold text-gray-900">
                            Charge for ~25 min
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase font-black">
                            15% → 70%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                    <Car size={12} />
                    <span>Drive 53 km (1 h 10 min)</span>
                  </div>
                </div>

                {/* Destination */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-red-500 shadow-sm z-10"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Indore, MP
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Destination
                      </p>
                      <p className="text-[10px] text-gray-500 mt-2">
                        Est. Arrival: 12:45 PM
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-50 rounded-lg">
                      <span className="text-[10px] font-bold text-red-600">
                        ~18%
                      </span>
                      <Battery size={12} className="text-red-500 rotate-180" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Eco Tip */}
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl text-green-500 shadow-sm">
                  <Leaf size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-green-900">Eco Tip</h5>
                  <p className="text-[10px] text-green-700 font-medium mt-0.5">
                    This trip will save ~12% energy compared to fastest route
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TripPlannerPage;
