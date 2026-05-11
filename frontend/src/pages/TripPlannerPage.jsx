import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import evData from "../../data/ev-data.json";

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
  Wifi,
  Coffee,
  ParkingCircle,
  Soup,
  Headphones,
  Info,
  ChevronLeft,
  ChevronRight,
  Heart,
  Trash2,
  MessageSquare,
  ArrowRight,
  Check
} from "lucide-react";

import TripPlannerMap from "../components/TripPlannerMap";
import { VehicleCard } from "../components/DiscoveryComponents";
import AIRecommendationCard from "../components/AIRecommendationCard";
import { socket } from "../utils/socket";

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
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [selectedStationId, setSelectedStationId] = useState(null);
  const selectedStation = useMemo(() =>
    selectedStationId ? stations.find(s => String(s._id) === String(selectedStationId)) : null
    , [selectedStationId, stations]);
  const [activeTab, setActiveTab] = useState("overview");
  const [waypoints, setWaypoints] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(() => {
    const saved = localStorage.getItem("evsync_ai_trip");
    return saved ? JSON.parse(saved) : [];
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const lastAiLocation = useRef(null);

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const getImageUrl = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1593941707882-a5bba14938c7";
    if (url.startsWith("http")) return url;
    return `${backendURL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const getAmenityIcon = (label) => {
    const icons = {
      restroom: Soup,
      cafe: Coffee,
      wifi: Wifi,
      parking: ParkingCircle,
      waiting: Clock,
      support: Headphones
    };
    return icons[label.toLowerCase()] || Info;
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (selectedStation?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedStation.images.length);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (selectedStation?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedStation.images.length) % selectedStation.images.length);
    }
  };

  // State for the next stop (booked station)
  const [nextStopId, setNextStopId] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);

  useEffect(() => {
    const paramId = searchParams.get("nextStopId");
    const storedId = localStorage.getItem("evsync_next_stop");

    if (paramId) {
      setNextStopId(paramId);
      localStorage.setItem("evsync_next_stop", paramId);
    } else if (storedId) {
      setNextStopId(storedId);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (nextStopId) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${backendURL}/api/bookings/my-bookings`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentBooking = response.data.find(b => String(b.stationId._id) === String(nextStopId));
          setBookingInfo(currentBooking);

          // Auto-add to waypoints if not already there
          if (currentBooking && !waypoints.some(wp => String(wp._id) === String(nextStopId))) {
            setWaypoints(prev => [...prev, currentBooking.stationId]);
          }
        } catch (error) {
          console.error("Error fetching booking for trip planner:", error);
        }
      }
    };
    fetchBookingDetails();
  }, [nextStopId, backendURL]);

  // Filter stations based on user vehicle compatibility
  const filteredStations = useMemo(() => {
    if (!user || !user.vehicles || user.vehicles.length === 0) return stations;

    const activeVehicle = user.vehicles[activeVehicleIndex];
    if (!activeVehicle) return stations;

    const vehicleDetails = evData.data.find(d => d.id === activeVehicle.vehicleId);
    if (!vehicleDetails) return stations;

    const userACPorts = (vehicleDetails.ac_charger?.ports || []).map(p => p.toLowerCase());
    const userDCPorts = (vehicleDetails.dc_charger?.ports || []).map(p => p.toLowerCase());

    return stations.map(station => ({
      ...station,
      distance: fromLocation && station.location?.coordinates 
        ? calculateDistance(fromLocation.lat, fromLocation.lng, station.location.coordinates[1], station.location.coordinates[0])
        : null
    })).filter(station => {
      if (!station.chargers || station.chargers.length === 0) return true;

      return station.chargers.some(charger => {
        const type = charger.type?.toLowerCase() || "";
        const isAC = ["type 2", "ac", "type-2"].some(t => type.includes(t));
        const isDC = ["ccs2", "chademo", "dc"].some(t => type.includes(t));

        if (isDC) {
          return userDCPorts.some(port => type.includes(port.replace(/\s+/g, "")));
        }
        if (isAC) {
          return userACPorts.some(port => {
            const p = port.replace(/\s+/g, "");
            return type.includes(p) ||
              type.includes(p.replace('type', 'type ')) ||
              type.includes(p.replace('type', 'type-'));
          });
        }
        return true;
      });
    });
  }, [stations, user, activeVehicleIndex]);

  // Filtered stations near the route for the map display
  const nearbyStations = useMemo(() => {
    if (!isRouteCalculated || !routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
      return filteredStations;
    }

    return filteredStations.filter(station => {
      const stationLat = station.location.coordinates[1];
      const stationLng = station.location.coordinates[0];

      return routeData.coordinates.some((point, index) => {
        if (index % 10 !== 0 && index !== routeData.coordinates.length - 1) return false;
        const dist = calculateDistance(stationLat, stationLng, point[0], point[1]);
        return dist <= 15;
      });
    });
  }, [filteredStations, isRouteCalculated, routeData]);

  // Intermediate stations for the itinerary
  const itineraryStops = useMemo(() => {
    if (!isRouteCalculated || !routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
      return [];
    }

    const stops = filteredStations.map(station => {
      const stationLat = station.location.coordinates[1];
      const stationLng = station.location.coordinates[0];

      let minDistance = Infinity;
      let closestIndex = -1;

      routeData.coordinates.forEach((point, index) => {
        const dist = calculateDistance(stationLat, stationLng, point[0], point[1]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });

      if (minDistance <= 5) {
        const totalPoints = routeData.coordinates.length;
        const totalDistanceKm = routeData.distance / 1000;
        const distanceFromStart = (closestIndex / totalPoints) * totalDistanceKm;
        const distanceFromEnd = totalDistanceKm - distanceFromStart;

        if (distanceFromStart < 5 || distanceFromEnd < 5) return null;

        return { ...station, distanceFromStart, closestIndex };
      }
      return null;
    }).filter(s => s !== null);

    const sortedStops = stops.sort((a, b) => a.closestIndex - b.closestIndex);

    return sortedStops.map((stop, idx) => {
      const avgSpeedKmH = 50;
      const durationHours = stop.distanceFromStart / avgSpeedKmH;
      const arrivalTime = new Date(new Date().getTime() + (durationHours * 3600 * 1000));

      return {
        ...stop,
        estimatedArrival: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isWaypoint: waypoints.some(wp => wp._id === stop._id),
        isNextStop: String(stop._id) === String(nextStopId)
      };
    });
  }, [filteredStations, isRouteCalculated, routeData, waypoints, nextStopId]);

  const debounceTimer = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveToRecent = (suggestion) => {
    const newRecent = [
      suggestion,
      ...recentSearches.filter((s) => s.place_id !== suggestion.place_id),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("recent_searches", JSON.stringify(newRecent));
  };

  useEffect(() => {
    const savedTrip = localStorage.getItem("evsync_trip_data");
    if (savedTrip) {
      try {
        const data = JSON.parse(savedTrip);
        if (data.from) setFrom(data.from);
        if (data.to) setTo(data.to);
        if (data.fromLocation) setFromLocation(data.fromLocation);
        if (data.toLocation) setToLocation(data.toLocation);
        if (data.waypoints) setWaypoints(data.waypoints);
        if (data.isRouteCalculated) setIsRouteCalculated(data.isRouteCalculated);
        if (data.routeData) setRouteData(data.routeData);
      } catch (e) {
        console.error("Error parsing saved trip:", e);
      }
    }
    const savedFavorites = localStorage.getItem("evsync_favorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  useEffect(() => {
    const tripData = { from, to, fromLocation, toLocation, waypoints, isRouteCalculated, routeData };
    localStorage.setItem("evsync_trip_data", JSON.stringify(tripData));
  }, [from, to, fromLocation, toLocation, waypoints, isRouteCalculated, routeData]);

  useEffect(() => {
    localStorage.setItem("evsync_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const clearTrip = () => {
    setFrom("");
    setTo("");
    setFromLocation(null);
    setToLocation(null);
    setWaypoints([]);
    setIsRouteCalculated(false);
    setRouteData(null);
    localStorage.removeItem("evsync_trip_data");
    localStorage.removeItem("evsync_next_stop");
    setNextStopId(null);
  };

  const toggleFavorite = (stationId) => {
    setFavorites(prev => prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]);
  };

  const handleShare = (station) => {
    const shareText = `Check out this charging station: ${station.name} - ${station.address}`;
    if (navigator.share) {
      navigator.share({ title: station.name, text: shareText, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      alert("Link copied to clipboard!");
    }
  };

  const watchId = useRef(null);
  const hasSetInitialLocation = useRef(false);

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
        (error) => console.error("Error watching location:", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
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
          let biasParams = "";
          if (fromLocation) {
            const { lat, lng } = fromLocation;
            const offset = 0.5;
            biasParams = `&viewbox=${lng - offset},${lat + offset},${lng + offset},${lat - offset}`;
          }
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=in${biasParams}`);
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error("Error fetching locations:", error);
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [fromLocation],
  );

  useEffect(() => {
    const fetchStations = async () => {
      try {
        let url = `${backendURL}/api/stations`;
        if (fromLocation) url = `${backendURL}/api/stations/nearby?lat=${fromLocation.lat}&lng=${fromLocation.lng}&distance=200`;
        const response = await fetch(url);
        const data = await response.json();
        setStations(data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    fetchStations();
  }, [fromLocation?.lat, fromLocation?.lng]);

  useEffect(() => {
    if (!isRouteCalculated || !routeData || !routeData.coordinates || routeData.coordinates.length === 0) return;
    const fetchAlongRoute = async () => {
      const coords = routeData.coordinates;
      const indices = [0, Math.floor(coords.length / 4), Math.floor(coords.length / 2), Math.floor((coords.length * 3) / 4), coords.length - 1];
      for (const idx of indices) {
        const point = coords[idx];
        if (!point) continue;
        try {
          const res = await fetch(`${backendURL}/api/stations/nearby?lat=${point[0]}&lng=${point[1]}&distance=50`);
          if (!res.ok) continue;
          const data = await res.json();
          setStations(prev => {
            const existingIds = new Set(prev.map(s => String(s._id)));
            const uniqueNew = data.filter(s => !existingIds.has(String(s._id)));
            return [...prev, ...uniqueNew];
          });
        } catch (e) {
          console.error("Error fetching along route point:", point, e);
        }
      }
    };
    fetchAlongRoute();
  }, [routeData, isRouteCalculated, backendURL]);

  useEffect(() => {
    if (isRouteCalculated && itineraryStops.length > 0 && fromLocation) {
      let shouldFetch = aiRecommendations.length === 0;
      
      if (lastAiLocation.current) {
        const dist = calculateDistance(
          fromLocation.lat, 
          fromLocation.lng, 
          lastAiLocation.current.lat, 
          lastAiLocation.current.lng
        );
        if (dist > 0.1) shouldFetch = true;
      } else {
        shouldFetch = true;
      }

      if (!shouldFetch || isAiLoading) return;

      const fetchAIRecommendations = async () => {
        setIsAiLoading(true);
        lastAiLocation.current = fromLocation;
        try {
          const availableStops = itineraryStops
            .filter(s => s.chargers?.some(c => c.status === "available"))
            .slice(0, 10);

          if (availableStops.length === 0) {
            setIsAiLoading(false);
            return;
          }

          const response = await fetch(`${backendURL}/api/ai/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userLocation: fromLocation,
              vehicleInfo: user?.vehicles?.[activeVehicleIndex] || {},
              stations: availableStops,
              destination: to
            }),
          });
          const data = await response.json();
          if (data.success) {
            setAiRecommendations(data.recommendations);
            localStorage.setItem("evsync_ai_trip", JSON.stringify(data.recommendations));
          }
        } catch (error) {
          console.error("Error fetching AI recommendations:", error);
        } finally {
          setIsAiLoading(false);
        }
      };
      fetchAIRecommendations();
    }
  }, [isRouteCalculated, itineraryStops.length, fromLocation, user, activeVehicleIndex, to]);

  // Real-time charger updates
  useEffect(() => {
    const handleChargerStatus = (data) => {
      setStations(prev => prev.map(station => {
        if (String(station._id) === String(data.stationId)) {
          return {
            ...station,
            chargers: station.chargers.map(charger => {
              if (charger.chargerId === data.chargerId) {
                return { ...charger, status: data.status };
              }
              return charger;
            })
          };
        }
        return station;
      }));
    };

    socket.on('charger_status_updated', handleChargerStatus);
    return () => socket.off('charger_status_updated', handleChargerStatus);
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
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Plan Your Trip
                  </h2>
                  {(from || to || isRouteCalculated) && (
                    <button
                      onClick={clearTrip}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg transition-all"
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
                </div>
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
              <VehicleCard />

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
                onStationSelect={(station) => setSelectedStationId(station._id)}
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
                {/* Image Header with Slider */}
                <div className="h-64 w-full relative group">
                  <img
                    src={getImageUrl(selectedStation.images?.[currentImageIndex])}
                    alt={selectedStation.name}
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"; }}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setSelectedStationId(null);
                      setCurrentImageIndex(0);
                    }}
                    className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:bg-white transition-all active:scale-90 z-10"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(selectedStation._id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-90 z-10"
                  >
                    <Heart size={20} className={favorites.includes(selectedStation._id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                  </button>

                  {/* Image Navigation Arrows */}
                  {selectedStation.images?.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-10"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-10"
                      >
                        <ChevronRight size={16} />
                      </button>

                      <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
                        {selectedStation.images.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg">
                      {selectedStation.operatingHours || "24 HOURS"}
                    </span>
                    <button className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black/70 transition-all">
                      <History size={14} /> See all {selectedStation.images?.length || 1} photos
                    </button>
                  </div>
                </div>

                {/* Title & Info */}
                <div className="p-6 pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        {selectedStation.name}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedStation.stationType || "Public"} Charging Hub
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-amber-700">{selectedStation.rating || "4.5"}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {selectedStation.reviewsCount || 12} Reviews
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 mt-6 sticky top-0 bg-white z-20">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === "overview" ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Overview
                    {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === "reviews" ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Reviews
                    {activeTab === "reviews" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />}
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto no-scrollbar">
                  {activeTab === "overview" ? (
                    <div className="p-6 space-y-8 pb-10">
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center gap-2 px-1">
                        {[
                          { icon: Navigation, label: "Directions", color: "bg-[#1A73E8] text-white", onClick: () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.location.coordinates[1]},${selectedStation.location.coordinates[0]}`, "_blank") },
                          {
                            icon: waypoints.some(wp => wp._id === selectedStation._id) ? Minus : Plus,
                            label: waypoints.some(wp => wp._id === selectedStation._id) ? "Remove Stop" : "Add to Trip",
                            color: waypoints.some(wp => wp._id === selectedStation._id) ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
                            onClick: () => {
                              if (waypoints.some(wp => wp._id === selectedStation._id)) {
                                setWaypoints(waypoints.filter(wp => wp._id !== selectedStation._id));
                              } else {
                                setWaypoints([...waypoints, selectedStation]);
                              }
                            }
                          },
                          { icon: Heart, label: "Favorite", color: favorites.includes(selectedStation._id) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600", onClick: () => toggleFavorite(selectedStation._id) },
                          { icon: Share2, label: "Share", color: "bg-blue-50 text-blue-600", onClick: () => handleShare(selectedStation) }
                        ].map((btn, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                            <button
                              onClick={btn.onClick}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${btn.color}`}
                            >
                              <btn.icon size={20} fill={idx === 0 ? "white" : "none"} />
                            </button>
                            <span className="text-[10px] font-bold text-center text-gray-600 leading-tight">
                              {btn.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Chargers Section */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Available Chargers</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedStation.chargers?.map((charger, idx) => {
                            const isAvailable = charger.status === "available";
                            return (
                              <div key={idx} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:bg-white hover:border-emerald-200 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isAvailable ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                                    <EvCharger size={24} />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">
                                      {charger.type} · {charger.power} kW
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                      {charger.type.includes("DC") || charger.power > 30 ? "Fast Charging" : "Regular Charging"}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md mb-1 inline-block ${isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                    {isAvailable ? "Available" : "In Use"}
                                  </div>
                                  <div className="text-xs font-bold text-gray-700 block">
                                    ₹{charger.pricePerUnit || 15}/kWh
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Amenities Section */}
                      {selectedStation.amenities?.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Station Amenities</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedStation.amenities.map((amenity, idx) => {
                              const Icon = getAmenityIcon(amenity);
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                                    <Icon size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-600 capitalize">{amenity}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Location Details */}
                      <div className="space-y-6 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div className="flex-grow pt-1">
                            <p className="text-sm font-bold text-gray-700 leading-relaxed">
                              {selectedStation.address}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Exact Location</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                            <Building2 size={20} />
                          </div>
                          <div className="flex-grow pt-2">
                            <p className="text-sm font-bold text-gray-700">
                              Operator: <span className="text-emerald-600">{selectedStation.operatorName || "EVSync Network"}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Booking Action */}
                      <div className="pt-6 border-t border-gray-100">
                        <button
                          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-[#189641] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                          onClick={() => {
                            localStorage.setItem("evsync_trip_in_progress", "true");
                            navigate(`/book-slot/${selectedStation._id}`);
                          }}
                        >
                          <Calendar size={18} />
                          Book Slot for {itineraryStops.find(s => s._id === selectedStation._id)?.estimatedArrival || "12:30 PM"}
                        </button>

                        <p className="text-[10px] text-gray-400 text-center mt-3 font-bold uppercase tracking-widest">
                          Free cancellation up to 30 mins before arrival
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-8">
                      {/* Add Review Button */}
                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={18} /> Write a Review
                        </button>
                      ) : (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-900">Your Review</h4>
                            <button onClick={() => setShowReviewForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>

                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="transition-transform active:scale-90"
                              >
                                <Star
                                  size={24}
                                  fill={star <= newReview.rating ? "#FBBF24" : "none"}
                                  className={star <= newReview.rating ? "text-yellow-400" : "text-gray-300"}
                                />
                              </button>
                            ))}
                          </div>

                          <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            placeholder="Share your experience at this station..."
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 min-h-[100px] font-medium"
                          />

                          <button
                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all"
                            onClick={() => {
                              alert("Review submitted! (Mock)");
                              setShowReviewForm(false);
                              setNewReview({ rating: 5, comment: "" });
                            }}
                          >
                            Submit Review
                          </button>
                        </div>
                      )}

                      {/* Review List */}
                      <div className="space-y-6">
                        {(selectedStation.reviews?.length > 0 ? selectedStation.reviews : [
                          { user: "Rahul Sharma", rating: 5, comment: "Excellent fast charging station. The lounge was clean and comfortable.", date: "2 days ago" },
                          { user: "Anita Desai", rating: 4, comment: "Good experience, but one charger was out of service.", date: "1 week ago" }
                        ]).map((review, idx) => (
                          <div key={idx} className="space-y-2 pb-6 border-b border-gray-50 last:border-0">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                {review.userAvatar ? (
                                  <img
                                    src={getImageUrl(review.userAvatar)}
                                    alt=""
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    className="w-8 h-8 rounded-full object-cover border border-emerald-100"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                    {(typeof review.user === 'string' ? review.user : (review.user?.name || review.userId?.name || review.userName || "U"))[0]}
                                  </div>
                                )}
                                <div>
                                  <h5 className="text-sm font-bold text-gray-900">
                                    {typeof review.user === 'string' ? review.user : (review.user?.name || review.userId?.name || review.userName || "Anonymous User")}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 font-medium">
                                    {review.date || (review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    fill={i < review.rating ? "currentColor" : "none"}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium pl-11">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>

                      {(!selectedStation.reviews || selectedStation.reviews.length === 0) && (
                        <div className="flex flex-col items-center justify-center text-center py-10 gap-4 opacity-60">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            <MessageSquare size={32} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">No more reviews</h4>
                            <p className="text-sm text-gray-400 mt-1">Be the first to rate this station</p>
                          </div>
                        </div>
                      )}
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

                {(aiRecommendations.length > 0 || isAiLoading) && (
                  <AIRecommendationCard 
                    recommendations={aiRecommendations} 
                    stations={filteredStations}
                    isLoading={isAiLoading} 
                  />
                )}

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
                        onClick={() => setSelectedStationId(stop._id)}
                      >
                        {/* Timeline Connector Dot */}
                        <div className={`absolute -left-1.5 top-1.5 w-6 h-6 rounded-full border-4 border-white ${isFullyOccupied ? 'bg-amber-500' : 'bg-emerald-500'} flex items-center justify-center text-[10px] text-white font-black z-10 shadow-md group-hover:scale-110 transition-all duration-300 ring-4 ring-gray-50`}>
                          {index + 1}
                        </div>

                        <div className={`bg-white border ${stop.isNextStop ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-100'} p-3 rounded-xl shadow-sm hover:shadow-xl hover:shadow-green-500/5 hover:border-green-500/20 transition-all duration-300 group-hover:-translate-y-1 relative`}>
                          {stop.isNextStop && (
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg z-20 ">
                              Next Stop
                            </div>
                          )}
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
                                  {stop.external && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-md tracking-tighter">
                                      External
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
                          {stop.isNextStop && bookingInfo ? (
                            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col gap-4 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-1 bg-emerald-500 text-white rounded-bl-lg">
                                <Check size={10} strokeWidth={4} />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Confirmed Booking</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock size={12} className="text-emerald-500" />
                                    <span className="text-xs font-bold text-gray-900">{bookingInfo.startTime}</span>
                                  </div>
                                </div>
                                <div className="bg-white p-1 rounded-lg shadow-sm border border-emerald-100">
                                  <QRCodeCanvas
                                    value={`${window.location.origin}/verify-booking/${bookingInfo._id}`}
                                    size={45}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/60 p-2 rounded-xl border border-emerald-100">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase block">OTP Code</span>
                                  <span className="text-sm font-black text-emerald-600 tracking-widest">{bookingInfo.otp}</span>
                                </div>
                                <div className="bg-white/60 p-2 rounded-xl border border-emerald-100">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase block">Charger</span>
                                  <span className="text-[10px] font-bold text-gray-900 truncate">{bookingInfo.chargerId}</span>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/booking-success/${bookingInfo._id}`);
                                }}
                                className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                              >
                                View Digital Ticket <ArrowRight size={14} />
                              </button>
                            </div>
                          ) : (
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
                                {stop.external ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const lat = stop.location?.coordinates[1];
                                      const lng = stop.location?.coordinates[0];
                                      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                    }}
                                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-bold hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Navigation size={14} />
                                    Open Maps
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      localStorage.setItem("evsync_trip_in_progress", "true");
                                      navigate(`/book-slot/${stop._id}`);
                                    }}
                                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold hover:bg-[#189641] shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Calendar size={14} />
                                    Book Slot
                                  </button>
                                )}
                              </div>
                          )}

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
