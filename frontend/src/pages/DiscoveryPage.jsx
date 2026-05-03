import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapComponent from "../components/MapComponent";
import Navbar from "../components/Navbar";
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
} from "../components/DiscoveryComponents";
import evData from "../../data/ev-data.json";

// Minimal station icon for the detail map preview
const createStationIcon = (station) => {
  const isAvailable = station?.status === "available" || station?.isAvailable !== false;
  const color = isAvailable ? "#1BAC4B" : "#f1be25ff";
  return L.divIcon({
    className: "custom-station-icon",
    html: `
      <div style="position:relative">
        <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2))">
          <path d="M18 42C18 42 36 28.5 36 18C36 8.05888 27.9411 0 18 0C8.05888 0 0 8.05888 0 18C0 28.5 18 42 18 42Z" fill="white"/>
          <path d="M18 39.5C18 39.5 33 26.5 33 18C33 9.71573 26.2843 3 18 3C9.71573 3 3 9.71573 3 18C3 26.5 18 39.5 18 39.5Z" fill="${color}"/>
          <circle cx="18" cy="18" r="12" fill="white"/>
          <path d="M19 8L10 20H17L16 28L25 16H18L19 8Z" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
  });
};

const DiscoveryPage = () => {
  const navigate = useNavigate();
  const { user, activeVehicleIndex } = useSelector((state) => state.auth);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [maxRange, setMaxRange] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const [mapStyle] = useState(localStorage.getItem("evsync_map_style") || "default");
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

  // Auto-sync filter with vehicle charger
  useEffect(() => {
    const activeVehicle = user?.vehicles?.[activeVehicleIndex];
    if (activeVehicle) {
      const details = evData.data.find(v => v.id === activeVehicle.vehicleId);
      const chargerType = details?.dc_charger?.ports?.[0] || details?.ac_charger?.ports?.[0];
      if (chargerType) setSelectedFilter(chargerType);
    }
  }, [activeVehicleIndex, user]);

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

      const matchesAvailability = !showAvailableOnly || station.chargers?.some(c => c.status === "available");

      return matchesSearch && matchesFilter && matchesAvailability;
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
      if (!maxRange) return true;
      return station.distance !== null && station.distance <= maxRange;
    })
    .sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

  const mapRef = useRef(null);

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

  const handleStartDriving = () => {
    setIsNavigating(true);
    setSimulatedLocation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStopDriving = () => {
    setIsNavigating(false);
    setSimulatedLocation(null);
    setSelectedStation(null);
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

  return (
    <div className="min-h-90vh w-full bg-[#F8FAF9] flex flex-col font-sans overflow-x-hidden">
      <main className="p-4 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
        {/* Top Layout Section */}
        <div className="flex gap-2 h-[750px]">
          {/* Left Sidebar */}
          <aside className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-2">
            <VehicleCard onChange={() => console.log("Change vehicle")} />
            <ReachableStationsCard
              total={stations.length}
              withinRange={filteredStations.length}
              onRangeFilter={setMaxRange}
            />
            <FilterSection onShowStations={(filter, available) => {
              setSelectedFilter(filter);
              setShowAvailableOnly(available);
            }} />
          </aside>

          {/* Center Section (Smart Map with Integrated Overlays) */}
          <section className="flex-grow bg-white border-4 border-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute inset-0">
              <MapComponent
                stations={filteredStations}
                onStationSelect={setSelectedStation}
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

            {/* Station Detail View — map on top, card below */}
            {selectedStation && !isNavigating && (
              <div className="absolute inset-0 z-[2000] flex flex-col bg-white overflow-hidden">
                {/* Top: Simple Leaflet map centered on selected station */}
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
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-white text-gray-700 text-[11px] font-bold px-4 py-2.5 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft size={14} />
                    Back to Discovery
                  </button>
                </div>

                {/* Bottom: Station Detail Card */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  <StationDetailView
                    station={selectedStation}
                    onClose={() => setSelectedStation(null)}
                    onNavigate={handleStartDriving}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="w-96 bg-white p-4 shadow-sm rounded-xl flex flex-col gap-4 shrink-0 pr-2">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-bold text-gray-800">
                Nearby Stations 
              </h2>
              <span className="bg-green-50 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {filteredStations.length} Results
              </span>
            </div>
            <div className="flex-grow overflow-y-auto px-2 custom-scrollbar space-y-4">
              {filteredStations.length > 0 ? (
                filteredStations.map((station) => (
                  <StationListItem
                    key={station._id}
                    station={station}
                    onClick={() => setSelectedStation(station)}
                    distance={station.distance}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Zap size={24} className="text-gray-300" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">No chargers found</h3>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                    No charging available for your vehicle charger type ({selectedFilter === "All" ? "any type" : selectedFilter}) in this area.
                  </p>
                  <button 
                    onClick={() => setSelectedFilter("All")}
                    className="mt-4 text-emerald-500 font-bold text-[10px] uppercase tracking-widest hover:underline"
                  >
                    Show all stations
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

    
      </main>
    </div>
  );
};

export default DiscoveryPage;
