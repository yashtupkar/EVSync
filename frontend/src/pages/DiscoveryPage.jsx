import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapComponent from "../components/MapComponent";
import Navbar from "../components/Navbar";
import { socket } from "../utils/socket";
import {
  Info,
  Zap,
  Clock,
  Heart,
  Search,
  Layers,
  Plus,
  Minus,
  Navigation,
  Route as RouteIcon,
  Map as MapIcon,
  Star,
  ArrowLeft,
  Filter as FilterIcon,
  Check,
  EvCharger,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Route,
} from "lucide-react";
import {
  VehicleCard,
  ReachableStationsCard,
  FilterSection,
  StationListItem,
  QuickActionCard,
  RangeOverviewCard,
  StationDetailView,
  NavigationOverlay,
  HomeChargerPromoCard,
} from "../components/DiscoveryComponents";
import AIRecommendationCard from "../components/AIRecommendationCard";
import { motion, AnimatePresence } from "framer-motion";
import evData from "../../data/ev-data.json";

// Minimal station icon for the detail map preview
const createStationIcon = (station) => {
  const isAvailable = station?.status === "available" || station?.isAvailable !== false;
  const isHomeCharger = station?.stationType === "home-charger";
  const isExternal = station?.external;

  let iconUrl = "/assets/map-markers/available.png";

  if (isExternal) {
    iconUrl = "/assets/map-markers/external-staiton.png";
  } else if (isHomeCharger) {
    iconUrl = isAvailable 
      ? "/assets/map-markers/home-available.png" 
      : "/assets/map-markers/home-occupied.png";
  } else {
    iconUrl = isAvailable 
      ? "/assets/map-markers/available.png" 
      : "/assets/map-markers/occupied.png";
  }

  return L.icon({
    iconUrl,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    className: "custom-station-icon-img",
  });
};

const DiscoveryPage = () => {
  const navigate = useNavigate();
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);

  const [isNavigating, setIsNavigating] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState({ now: false, today: false, occupied: false });
  const [powerFilter, setPowerFilter] = useState(120);
  const [maxRange, setMaxRange] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(() => {
    const saved = localStorage.getItem("evsync_ai_discovery");
    return saved ? JSON.parse(saved) : [];
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const lastAiLocation = useRef(null);
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mapStyle] = useState(localStorage.getItem("evsync_map_style") || "default");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const mapStyles = {
    default: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    modern: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    night: {
      url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    retro: {
      url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
    },
  };


  const watchId = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      // Start watching the position in real-time
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({
            lat: latitude,
            lng: longitude,
          });
          // Also update simulated location if not simulating to keep marker in sync
          if (!isSimulating) {
            // simulatedLocation is used for the "driving" marker
            // so if we are not simulating, the driving marker should be at userLocation
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredStations = stations
    .filter((station) => {
      const matchesSearch =
        station.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetFilter = normalize(selectedFilter);

      const matchesFilter =
        targetFilter === "all" ||
        station.chargers?.some(c => normalize(c.type) === targetFilter);

      const matchesAvailability =
        (availabilityFilter.now && station.chargers?.some(c => c.status === "available")) ||
        (availabilityFilter.today && station.chargers?.some(c => c.status === "available" || c.status === "occupied")) ||
        (availabilityFilter.occupied && station.chargers?.every(c => c.status === "occupied" || c.status === "in_use"));

      const matchesPower = !powerFilter || station.chargers?.some(c => (c.power || 0) >= 0); // Simplified for now as powerFilter is max in UI but logic usually implies min. 
      // Actually the UI shows "120 KW" as the value. Let's assume it's a min power filter if user slides it down? 
      // Or if it's 120, it shows everything. If it's 60, it shows >= 60.
      const matchesPowerReal = station.chargers?.some(c => (c.power || 0) >= (120 - powerFilter));
      // Wait, usually sliders are Min to Max. The UI has 10 to 120. If value is 120, maybe it means Max? 
      // Most users want "At least X kW". So if slider is at 60, show >= 60.
      const matchesPowerMin = station.chargers?.some(c => (c.power || 0) >= (powerFilter === 120 ? 0 : powerFilter));

      return matchesSearch && matchesFilter && (availabilityFilter.now || availabilityFilter.today || availabilityFilter.occupied ? matchesAvailability : true) && matchesPowerMin;
    })
    .map((station) => ({
      ...station,
      distance:
        userLocation && station.location?.coordinates
          ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            station.location.coordinates[1],
            station.location.coordinates[0],
          )
          : null,
    }))
    .filter((station) => {
      // Secondary filter for distance after calculation
      // If maxRange is null, we show everything. 
      if (maxRange === null) return true;
      // If maxRange is set but distance is null (no GPS), we hide it because we can't tell if it's reachable
      return station.distance !== null && station.distance <= maxRange;
    })
    .sort((a, b) => {
      // Prioritize local stations if they are within a similar distance range
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;

      // If distances are very close (within 100m), prefer local
      if (Math.abs(a.distance - b.distance) < 0.1) {
        if (!a.external && b.external) return -1;
        if (a.external && !b.external) return 1;
      }

      return a.distance - b.distance;
    });

  // Split into Map vs List
  const listStations = useMemo(() => {
    // If no maxRange is set, show everything in the list
    if (maxRange === null) return filteredStations;
    
    // Otherwise, filter by distance
    return filteredStations.filter(station => {
      return station.distance !== null && station.distance <= maxRange;
    });
  }, [filteredStations, maxRange]);

  const mapRef = useRef(null);

  useEffect(() => {
    const fetchGlobalStations = async () => {
      try {
        const response = await fetch(`${backendURL}/api/stations`);
        const data = await response.json();
        setStations(prev => {
          const existingIds = new Set(prev.map(s => String(s._id)));
          const uniqueNew = data.filter(s => !existingIds.has(String(s._id)));
          return [...prev, ...uniqueNew];
        });
      } catch (error) {
        console.error("Error fetching global stations:", error);
      }
    };
    fetchGlobalStations();
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const fetchNearbyStations = async () => {
      try {
        const url = `${backendURL}/api/stations/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&distance=200`;
        const response = await fetch(url);
        const data = await response.json();
        setStations(prev => {
          const nearbyIds = new Set(data.map(s => String(s._id)));
          const others = prev.filter(s => !nearbyIds.has(String(s._id)));
          return [...data, ...others];
        });
      } catch (error) {
        console.error("Error fetching nearby stations:", error);
      }
    };
    fetchNearbyStations();
  }, [userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    if (stations.length > 0 && userLocation) {
      let shouldFetch = aiRecommendations.length === 0;
      
      if (lastAiLocation.current) {
        const dist = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
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
        lastAiLocation.current = userLocation;
        try {
          const availableStations = stations
            .filter(s => s.chargers?.some(c => c.status === "available"))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 10);

          if (availableStations.length === 0) {
            setIsAiLoading(false);
            return;
          }

          const response = await fetch(`${backendURL}/api/ai/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userLocation,
              vehicleInfo: user?.vehicles?.[activeVehicleIndex] || {},
              stations: availableStations,
            }),
          });
          const data = await response.json();
          if (data.success) {
            setAiRecommendations(data.recommendations);
            localStorage.setItem("evsync_ai_discovery", JSON.stringify(data.recommendations));
          }
        } catch (error) {
          console.error("Error fetching AI recommendations:", error);
        } finally {
          setIsAiLoading(false);
        }
      };
      fetchAIRecommendations();
    }
  }, [stations.length, userLocation, user, activeVehicleIndex]);

  // Real-time charger updates
  useEffect(() => {
    const handleChargerStatus = (data) => {
      console.log("[SOCKET_DEBUG] Charger status updated:", data);
      setStations(prev => {
        const updated = prev.map(station => {
          if (String(station._id) === String(data.stationId)) {
            console.log("[SOCKET_DEBUG] Station match in DiscoveryPage. Updating chargers...");
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
        });
        return updated;
      });
    };

    socket.on('charger_status_updated', handleChargerStatus);
    return () => socket.off('charger_status_updated', handleChargerStatus);
  }, []);

  const handleStartDriving = () => {
    setIsNavigating(true);
    setSimulatedLocation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStopDriving = () => {
    setIsNavigating(false);
    setSimulatedLocation(null);
    setSelectedStationId(null);
  };

  const handleRouteUpdate = (data) => {
    if (!data || typeof data.distance === "undefined") {
      setRouteInfo({
        distance: "---",
        duration: "---",
        instruction: "Route not found",
      });
      return;
    }

    setRouteInfo({
      distance: (data.distance / 1000).toFixed(1) + " km",
      duration: Math.round(data.duration / 60) + " min",
      instruction: data.instructions?.[0]?.text || "Drive safely",
    });
    setRouteCoordinates(data.coordinates);
  };

  const startSimulation = () => {
    if (routeCoordinates.length === 0) return;
    setIsSimulating(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index >= routeCoordinates.length) {
        clearInterval(interval);
        setIsSimulating(false);
        setIsNavigating(false);
        setSimulatedLocation(null);
        alert("You have arrived at your destination!");
        return;
      }
      const coord = routeCoordinates[index];
      setSimulatedLocation([coord.lat, coord.lng]);
      index += 5; // Move faster for simulation
    }, 500);
    return () => clearInterval(interval);
  };

  const [selectedStationId, setSelectedStationId] = useState(null);
  const selectedStation = useMemo(() =>
    selectedStationId ? stations.find(s => String(s._id) === String(selectedStationId)) : null
    , [selectedStationId, stations]);

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#F8FAF9] flex flex-col font-sans overflow-x-hidden">
      {isMobile ? (
        <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden bg-white">
          {/* Map Section */}
          <div className="absolute inset-0">
            <MapComponent
              stations={filteredStations}
              onStationSelect={(s) => setSelectedStationId(s._id)}
              destination={isNavigating ? selectedStation : null}
              simulatedLocation={simulatedLocation}
              isSimulating={isNavigating}
              hideControls={!!selectedStation}
              showRoute={isNavigating}
              onRouteUpdate={handleRouteUpdate}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              hideSearch={isMobile}
              mobileControlsOffset={isMobile ? 280 : 0}
              routeInfo={routeInfo}
              onStopNavigation={handleStopDriving}
              onStartSimulation={startSimulation}
              isSimulationActive={isSimulating}
            />
          </div>

          {/* Floating Top Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3"
          >
            <div className={`bg-white/85 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 p-1.5 flex items-center gap-1 transition-all duration-300 ${isFocused ? 'ring-2 ring-emerald-500/30 shadow-emerald-500/10' : ''}`}>
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search charging hubs..." 
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-gray-800 placeholder:text-gray-400 px-2"
                />
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button 
                  onClick={() => setSelectedStationId(null)}
                  className="p-2.5 text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  <Layers size={20} />
                </button>
            </div>
            
            {/* Quick Filter Pills removed for cleaner mobile UI */}
          </motion.div>

          {/* Draggable Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: selectedStation ? "0%" : (searchQuery || isFocused) ? "15%" : "60%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 500 }}
            dragElastic={0.05}
            className="absolute inset-0 z-[2000] bg-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.12)] flex flex-col border-t border-gray-100"
            style={{ top: "15%" }}
          >
            {/* Handle */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
              <div className="w-14 h-1.5 bg-gray-200/80 rounded-full transition-colors hover:bg-gray-300"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
              {selectedStation ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <button 
                      onClick={() => setSelectedStationId(null)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Hub Identity</span>
                      <h3 className="text-sm font-bold text-gray-800">Station Overview</h3>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-500">
                      <Heart size={18} />
                    </button>
                  </div>
                  <StationDetailView
                    station={selectedStation}
                    onClose={() => setSelectedStationId(null)}
                    onNavigate={handleStartDriving}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative pt-2 pb-4 border-b border-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-none tracking-tighter">
                          Charging <span className="text-emerald-500">Hubs</span>
                        </h2>
                        <div className="flex items-center gap-1.5 mt-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Live in your area</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="px-4 py-1.5 bg-gray-900 rounded-xl shadow-2xl shadow-gray-200">
                          <span className="text-lg font-black text-white leading-none">{listStations.length}</span>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Found Nearby</span>
                      </div>
                    </div>
                  </div>

                  {/* Removed Vehicle and Filter sections for mobile */}

                  <div className="space-y-5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em]">Nearby Results</h3>
                      <button className="text-[10px] font-bold text-emerald-500 uppercase">Sort By Distance</button>
                    </div>
                    <div className="space-y-4">
                      {listStations.length > 0 ? (
                        listStations.map((station) => (
                          <StationListItem
                            key={station._id}
                            station={station}
                            onClick={() => setSelectedStationId(station._id)}
                            distance={station.distance}
                          />
                        ))
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <EvCharger size={28} className="text-gray-300" />
                          </div>
                          <p className="text-sm font-bold text-gray-800">No hubs found</p>
                          <p className="text-[10px] text-gray-400 mt-1">Try adjusting your filters</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {(aiRecommendations.length > 0 || isAiLoading) && (
                    <div className="pt-2">
                      <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                          </div>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">AI Top Picks</h3>
                      </div>
                      <AIRecommendationCard 
                          recommendations={aiRecommendations} 
                          stations={filteredStations}
                          isLoading={isAiLoading} 
                        />
                    </div>
                  )}
                  
                  <div className="pb-4">
                    <HomeChargerPromoCard />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Navigation Overlay (when driving) */}
          {isNavigating && (
            <div className="absolute inset-0 z-[3000] bg-white">
              <div className="h-full flex flex-col">
                  <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={handleStopDriving} className="p-2">
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase">Navigating to</p>
                          <h4 className="text-sm font-bold truncate max-w-[200px]">{selectedStation?.name}</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black">{routeInfo?.duration || "---"}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{routeInfo?.distance || "---"}</p>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <MapComponent
                        stations={[selectedStation]}
                        onStationSelect={() => {}}
                        destination={selectedStation}
                        simulatedLocation={simulatedLocation}
                        isSimulating={true}
                        hideControls={true}
                        showRoute={true}
                        onRouteUpdate={handleRouteUpdate}
                        routeInfo={routeInfo}
                        onStopNavigation={handleStopDriving}
                        onStartSimulation={startSimulation}
                        isSimulationActive={isSimulating}
                      />
                      
                      {/* Floating Instruction Card removed for cleaner mobile UI */}

                      {!isSimulating && (
                        <button 
                          onClick={startSimulation}
                          className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-200 animate-pulse"
                        >
                          Start Trip
                        </button>
                      )}
                  </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout */
        <main className="p-2 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
          <div className="flex gap-2 max-h-[740px]">
            {/* Left Sidebar */}
            <aside className="w-80 flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar pr-2">
              <VehicleCard onChange={() => console.log("Change vehicle")} />
              <ReachableStationsCard
                total={stations.length}
                withinRange={listStations.length}
                onRangeFilter={setMaxRange}
              />
              <FilterSection
                stations={stations}
                onShowStations={(filters) => {
                  setSelectedFilter(filters.type);
                  setAvailabilityFilter(filters.availability);
                  setPowerFilter(filters.power);
                  setMaxRange(filters.distance);
                }}
              />
              <HomeChargerPromoCard />
            </aside>

            {/* Center Section (Smart Map) */}
            <section className="flex-grow bg-white border-4 border-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute inset-0">
                <MapComponent
                  stations={filteredStations}
                  onStationSelect={(s) => setSelectedStationId(s._id)}
                  destination={isNavigating ? selectedStation : null}
                  simulatedLocation={simulatedLocation}
                  isSimulating={isNavigating}
                  hideControls={!!selectedStation}
                  showRoute={isNavigating}
                  onRouteUpdate={handleRouteUpdate}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  routeInfo={routeInfo}
                  onStopNavigation={handleStopDriving}
                  onStartSimulation={startSimulation}
                  isSimulationActive={isSimulating}
                />
              </div>

              {/* Station Detail View Overlay */}
              {selectedStation && !isNavigating && (
                <div className="absolute inset-0 z-[2000] flex flex-col bg-white overflow-hidden">
                  <div className="relative h-[30%] shrink-0">
                    <MapContainer
                      center={[
                        selectedStation.location.coordinates[1],
                        selectedStation.location.coordinates[0],
                      ]}
                      zoom={15}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      dragging={false}
                      className="w-full h-full"
                      key={selectedStation._id}
                    >
                      <TileLayer
                        url={mapStyles[mapStyle]?.url || mapStyles.default.url}
                        attribution={mapStyles[mapStyle]?.attribution || mapStyles.default.attribution}
                      />
                      <Marker
                        position={[
                          selectedStation.location.coordinates[1],
                          selectedStation.location.coordinates[0],
                        ]}
                        icon={createStationIcon(selectedStation)}
                      />
                    </MapContainer>
                    <button
                      onClick={() => setSelectedStationId(null)}
                      className="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-white text-gray-700 text-[11px] font-bold px-4 py-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all"
                    >
                      <ArrowLeft size={14} />
                      Back to Discovery
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <StationDetailView
                      station={selectedStation}
                      onClose={() => setSelectedStationId(null)}
                      onNavigate={handleStartDriving}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Right Sidebar */}
            <aside className="w-96 bg-white p-4 shadow-sm rounded-xl flex flex-col gap-4 shrink-0 pr-2">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-lg font-bold text-gray-800">Nearby Stations</h2>
                <span className="bg-green-50 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {listStations.length} Results
                </span>
              </div>
              <div className="flex-grow overflow-y-auto px-2 custom-scrollbar space-y-4">
                {listStations.length > 0 ? (
                  listStations.map((station) => (
                    <StationListItem
                      key={station._id}
                      station={station}
                      onClick={() => setSelectedStationId(station._id)}
                      distance={station.distance}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Zap size={24} className="text-gray-300 mb-4" />
                    <h3 className="text-sm font-bold text-gray-800 mb-1">No chargers found</h3>
                    <button
                      onClick={() => { setSelectedFilter("All"); setSelectedStationId(null); }}
                      className="mt-4 text-emerald-500 font-bold text-[10px] uppercase hover:underline"
                    >
                      Show all stations
                    </button>
                  </div>
                )}
              </div>
              {(aiRecommendations.length > 0 || isAiLoading) && (
                <div className="mt-2">
                  <AIRecommendationCard 
                    recommendations={aiRecommendations} 
                    stations={filteredStations}
                    isLoading={isAiLoading} 
                  />
                </div>
              )}
            </aside>
          </div>
        </main>
      )}
    </div>
  );
};


export default DiscoveryPage;
