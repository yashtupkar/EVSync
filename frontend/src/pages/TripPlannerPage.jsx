import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  ArrowLeft,
  Smartphone,
  PhoneForwarded,
  Bookmark,
  Building2,
  EvCharger,
  PlugZap,
} from "lucide-react";
import TripPlannerMap from "../components/TripPlannerMap";
import { VehicleCard } from "../components/DiscoveryComponents";

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

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
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [waypoints, setWaypoints] = useState([]);

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Filtered stations near the route for the map display
  const nearbyStations = useMemo(() => {
    if (!isRouteCalculated || !routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
      return stations;
    }

    // Return stations that are within 15km of any point on the route
    return stations.filter(station => {
      const stationLat = station.location.coordinates[1];
      const stationLng = station.location.coordinates[0];

      return routeData.coordinates.some((point, index) => {
        if (index % 10 !== 0 && index !== routeData.coordinates.length - 1) return false;
        const dist = calculateDistance(stationLat, stationLng, point[0], point[1]);
        return dist <= 15; // 15km radius for map markers
      });
    });
  }, [stations, isRouteCalculated, routeData]);

  // Intermediate stations for the itinerary (strictly on route or very close)
  const itineraryStops = useMemo(() => {
    if (!isRouteCalculated || !routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
      return [];
    }

    const stops = stations.map(station => {
      const stationLat = station.location.coordinates[1];
      const stationLng = station.location.coordinates[0];

      let minDistance = Infinity;
      let closestIndex = -1;

      // Find closest point on route
      routeData.coordinates.forEach((point, index) => {
        const dist = calculateDistance(stationLat, stationLng, point[0], point[1]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });

      // If station is within 5km of the route, consider it an intermediate stop
      if (minDistance <= 5) {
        const totalPoints = routeData.coordinates.length;
        const totalDistanceKm = routeData.distance / 1000;
        const distanceFromStart = (closestIndex / totalPoints) * totalDistanceKm;
        const distanceFromEnd = totalDistanceKm - distanceFromStart;

        // Skip stations within 5km of start or destination to keep it "intermediate"
        if (distanceFromStart < 5 || distanceFromEnd < 5) return null;

        return {
          ...station,
          distanceFromStart,
          closestIndex
        };
      }
      return null;
    }).filter(s => s !== null);

    // Sort by sequence on the route
    const sortedStops = stops.sort((a, b) => a.closestIndex - b.closestIndex);

    // Calculate arrival times for each stop
    let currentDuration = 0;
    // This is simplified, real calculation would involve matching legs
    return sortedStops.map((stop, idx) => {
      // Estimate duration based on distance (simplified)
      const avgSpeedKmH = 50;
      const durationHours = stop.distanceFromStart / avgSpeedKmH;
      const arrivalTime = new Date(new Date().getTime() + (durationHours * 3600 * 1000));

      return {
        ...stop,
        estimatedArrival: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isWaypoint: waypoints.some(wp => wp._id === stop._id)
      };
    });
  }, [stations, isRouteCalculated, routeData, waypoints]);

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

  const watchId = useRef(null);

  const hasSetInitialLocation = useRef(false);

  // Get user current location and watch for changes
  useEffect(() => {
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFromLocation({ lat: latitude, lng: longitude });
          
          if (!hasSetInitialLocation.current) {
            setFrom("Your Location");
            hasSetInitialLocation.current = true;
          }
        },
        (error) => {
          console.error("Error watching location:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
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
        const response = await fetch(`${backendURL}/api/stations`);
        const data = await response.json();
        setStations(data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    fetchStations();
  }, []);

  return (
    <div className="max-h-screen w-full bg-zinc-100 flex flex-col font-sans overflow-x-hidden relative">
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

      <main className="px-4 py-2 h-full max-h-screen flex flex-col gap-4 max-w-[1600px] mx-auto w-full relative  overflow-hidden">
        <div className="flex gap-2 h-full overflow-hidden">
          {/* Left Sidebar - Plan Your Trip */}
          <aside className="w-90 flex flex-col gap-4 shrink-0 no-scrollbar overflow-y-auto custom-scrollbar  pb-10">
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

              {/* <div className="space-y-2">
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
              </div> */}
              <VehicleCard/>

              {/* <div className="space-y-2">
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
              </div> */}

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
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-[#189641] transition-all transform active:scale-[0.98]"
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
          <section className="flex-grow h-[90vh]  bg-white rounded-3xl shadow-sm border-4 border-white overflow-hidden relative sticky top-0">
            <div className="absolute inset-0">
              <TripPlannerMap
                stations={nearbyStations}
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
                waypoints={useMemo(() => {
                  if (!fromLocation || waypoints.length === 0) return waypoints;
                  return [...waypoints].sort((a, b) => {
                    const distA = calculateDistance(fromLocation.lat, fromLocation.lng, a.location.coordinates[1], a.location.coordinates[0]);
                    const distB = calculateDistance(fromLocation.lat, fromLocation.lng, b.location.coordinates[1], b.location.coordinates[0]);
                    return distA - distB;
                  });
                }, [waypoints, fromLocation])}
                onRouteUpdate={(data) => setRouteData(data)}
                onStationSelect={(station) => setSelectedStation(station)}
              />
            </div>

            {/* Map Overlays */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                <div className="bg-emerald-500 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1 min-w-[140px]">
                  <div className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Fastest Route
                  </div>
                  <div className="text-lg font-bold text-white">
                    3 h 45 min
                  </div>
                  <div className="text-xs text-gray-100 font-medium">
                    190 km
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white/40 flex flex-col gap-1 min-w-[140px] opacity-80">
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
                <div className="bg-white/60 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white/40 flex flex-col gap-1 min-w-[140px] opacity-80">
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
          <aside className="w-96 flex flex-col gap-4 shrink-0 no-scrollbar overflow-y-auto pb-10">
            {selectedStation ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 h-fit">
                {/* Image Header */}
                <div className="h-56 w-full relative group">
                  <img
                    src={selectedStation.images?.[0] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"}
                    alt={selectedStation.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:bg-white transition-all active:scale-90"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black/70 transition-all">
                    <History size={14} /> See photos
                  </button>
                </div>

                {/* Title & Stats */}
                <div className="p-6 pb-0">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {selectedStation.name}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {selectedStation.name} चार्जिंग स्टेशन
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm font-bold text-gray-700">{selectedStation.rating || "4.3"}</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.floor(selectedStation.rating || 4) ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 font-medium">({selectedStation.reviewsCount || "6"})</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Electric vehicle charging station
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 mt-6">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 py-3 text-sm font-bold transition-all relative ${activeTab === "overview" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Overview
                    {activeTab === "overview" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-green-500 rounded-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`flex-1 py-3 text-sm font-bold transition-all relative ${activeTab === "reviews" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Reviews
                    {activeTab === "reviews" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-green-500 rounded-full" />}
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  {activeTab === "overview" ? (
                    <div className="p-6 space-y-8 pb-10">
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center gap-2 px-1">
                        {[
                          { icon: Navigation, label: "Directions", color: "bg-[#1A73E8] text-white", onClick: () => { } },
                          {
                            icon: waypoints.some(wp => wp._id === selectedStation._id) ? Minus : Plus,
                            label: waypoints.some(wp => wp._id === selectedStation._id) ? "Remove Stop" : "Add to Trip",
                            color: waypoints.some(wp => wp._id === selectedStation._id) ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600",
                            onClick: () => {
                              if (waypoints.some(wp => wp._id === selectedStation._id)) {
                                setWaypoints(waypoints.filter(wp => wp._id !== selectedStation._id));
                              } else {
                                setWaypoints([...waypoints, selectedStation]);
                              }
                            }
                          },
                          { icon: Bookmark, label: "Save", color: "bg-blue-50 text-blue-600", onClick: () => { } },
                          { icon: Target, label: "Nearby", color: "bg-blue-50 text-blue-600", onClick: () => { } },
                          { icon: Share2, label: "Share", color: "bg-blue-50 text-blue-600", onClick: () => { } }
                        ].map((btn, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                            <button
                              onClick={btn.onClick}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${btn.color}`}
                            >
                              <btn.icon size={20} fill={idx === 0 ? "white" : "none"} />
                            </button>
                            <span className="text-[10px] font-bold text-center text-gray-600 leading-tight">
                              {btn.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Charger Types & Occupancy */}
                      <div className="space-y-6 pt-4 border-t border-gray-50">
                        {selectedStation.chargers?.map((charger, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                                <Zap size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {charger.type} · {charger.power} kW
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                  Level 3 Fast Charger
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-600">
                                Total <span className="ml-2 text-gray-900">1</span>
                              </div>
                              <div className="text-[10px] font-bold text-green-500 mt-0.5">
                                Available
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Location Details */}
                      <div className="space-y-6 pt-4 border-t border-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div className="flex-grow pt-1">
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">
                              {selectedStation.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                            <Building2 size={20} />
                          </div>
                          <div className="flex-grow pt-2">
                            <p className="text-sm font-medium text-gray-700">
                              Located in: <span className="font-bold text-gray-900">Emperor Lounge</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                            <Clock size={20} />
                          </div>
                          <div className="flex-grow pt-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-green-600">
                                Open 24 hours
                              </p>
                              <ChevronDown size={16} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Booking Action */}
                      <div className="pt-6 border-t border-gray-50">
                        <button
                          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-[#189641] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                          onClick={() => {
                            const stop = itineraryStops.find(s => s._id === selectedStation._id);
                            const time = stop ? stop.estimatedArrival : "12:30 PM";
                            alert(`Slot booked successfully for ${time}!`);
                          }}
                        >
                          <Calendar size={18} />
                          Book Slot for {itineraryStops.find(s => s._id === selectedStation._id)?.estimatedArrival || "12:30 PM"}
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">
                          Free cancellation up to 30 mins before arrival
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center py-20 gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <Star size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">No reviews yet</h4>
                        <p className="text-sm text-gray-400 mt-1">Be the first to rate this station</p>
                      </div>
                      <button className="mt-2 px-6 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-bold hover:bg-green-100 transition-all">
                        Write a review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Your Trip Itinerary
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {itineraryStops.length > 0 ? `${itineraryStops.length} Stops Found` : isRouteCalculated ? "No stops found on route" : "Planning route..."}
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all">
                    <Share2 size={14} /> Share Trip
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-2xl">
                  <div className="text-center border-r border-gray-200">
                    <div className="text-sm font-bold text-gray-900">
                      {routeData ? (routeData.distance / 1000).toFixed(1) + " km" : "---"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Total Distance
                    </div>
                  </div>
                  <div className="text-center border-r border-gray-200">
                    <div className="text-sm font-bold text-gray-900">
                      {routeData ? Math.floor(routeData.duration / 3600) + " h " + Math.round((routeData.duration % 3600) / 60) + " min" : "---"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      Total Time
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-500">
                      ~ {itineraryStops.length * 20} min
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

                  {/* Intermediate Stops */}
                  {itineraryStops.map((stop, index) => {
                    const availableSlots = stop.chargers?.filter(c => c.status === "available").length || 0;
                    const totalSlots = stop.chargers?.length || 0;
                    const isFullyOccupied = totalSlots > 0 && availableSlots === 0;

                    return (
                      <div
                        key={stop._id || index}
                        className="relative pl-6 pb-10 cursor-pointer group"
                        onClick={() => setSelectedStation(stop)}
                      >
                        {/* Timeline Connector Dot */}
                        <div className={`absolute -left-1.5 top-1.5 w-6 h-6 rounded-full border-4 border-white ${isFullyOccupied ? 'bg-amber-500' : 'bg-emerald-500'} flex items-center justify-center text-[10px] text-white font-black z-10 shadow-md group-hover:scale-110 transition-all duration-300 ring-4 ring-gray-50`}>
                          {index + 1}
                        </div>

                        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-xl hover:shadow-green-500/5 hover:border-green-500/20 transition-all duration-300 group-hover:-translate-y-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 ${isFullyOccupied ? 'bg-amber-500' : 'bg-emerald-500'} rounded-lg flex items-center justify-center transition-colors`}>
                                <EvCharger size={22} className={`${isFullyOccupied ? 'text-white' : 'text-white'} `} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                    {stop.name}
                                  </h4>
                                  {stop.isWaypoint && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[8px] font-black uppercase rounded-md tracking-tighter">
                                      Planned
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="flex items-center gap-0.5 text-yellow-500">
                                    <Star size={10} fill="currentColor" />
                                    <span className="text-[10px] font-bold text-gray-700">
                                      {stop.rating || "4.5"}
                                    </span>
                                  </div>
                                  <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {stop.distanceFromStart.toFixed(1)} km from start
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-gray-500 mb-2 line-clamp-1 bg-gray-50/50 p-2 rounded-lg border border-gray-50">
                            {stop.address}
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 border border-gray-200 ">
                              <div className="p-1.5  rounded-lg shadow-sm text-white bg-emerald-500">
                                <PlugZap size={14} />
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-gray-900 leading-none">
                                  {stop.chargers?.[0]?.power || "50"} kW
                                </div>
                                <div className="text-[8px] text-gray-400 uppercase font-black tracking-widest mt-1">
                                  {stop.chargers?.[0]?.type || "CCS2"}
                                </div>
                              </div>
                            </div>

                            <div className={`flex items-center gap-3 p-2 rounded-lg ${isFullyOccupied ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'} border group-hover:bg-white transition-all`}>
                              <div className={`p-1.5 rounded-lg shadow-sm ${isFullyOccupied ? 'bg-amber-500' : 'bg-emerald-500'} text-white`}>
                                <EvCharger size={14} />
                              </div>
                              <div>
                                <div className={`text-[10px] font-bold ${isFullyOccupied ? 'text-amber-700' : 'text-emerald-700'} leading-none`}>
                                  {isFullyOccupied ? 'Occupied' : 'Available'}
                                </div>
                                <div className={`text-[8px] uppercase font-black tracking-widest mt-1 ${isFullyOccupied ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {availableSlots} / {totalSlots} Slots
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4  border-t border-gray-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (stop.isWaypoint) {
                                  setWaypoints(waypoints.filter(wp => wp._id !== stop._id));
                                } else {
                                  setWaypoints([...waypoints, stop]);
                                }
                              }}
                              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${stop.isWaypoint
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-100 text-green-600 hover:bg-green-50"
                                }`}
                            >
                              {stop.isWaypoint ? <Minus size={14} /> : <Plus size={14} />}
                              {stop.isWaypoint ? "Remove" : "Add to Trip"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`Slot booked successfully for ${stop.estimatedArrival}!`);
                              }}
                              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold hover:bg-[#189641] shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2"
                            >
                              <Calendar size={14} />
                              Book Slot
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Destination */}
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-red-500 shadow-sm z-10"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {to.split(',')[0] || "Destination"}
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
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-4 mt-6">
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
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TripPlannerPage;
