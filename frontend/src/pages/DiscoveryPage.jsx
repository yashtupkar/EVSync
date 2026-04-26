import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

const DiscoveryPage = () => {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";


  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
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
    .filter(
      (station) =>
        station.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.city?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
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
    <div className="min-h-screen w-full bg-[#F8FAF9] flex flex-col font-sans overflow-x-hidden">
      <main className="p-4 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
        {/* Top Layout Section */}
        <div className="flex gap-2 h-[700px]">
          {/* Left Sidebar */}
          <aside className="w-90 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-2">
            <VehicleCard onChange={() => console.log("Change vehicle")} />
            <ReachableStationsCard
              total={stations.length}
              withinRange={Math.floor(stations.length * 0.7)}
            />
            <FilterSection onShowStations={() => console.log("Filtering...")} />
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

            {/* Station Detail View (Now as a pure overlay on top of smart map) */}
            {selectedStation && !isNavigating && (
              <div className="absolute inset-0 z-[2000]">
                <StationDetailView
                  station={selectedStation}
                  onClose={() => setSelectedStation(null)}
                  onNavigate={handleStartDriving}
                />
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="w-96 bg-white p-4 shadow-sm rounded-xl flex flex-col gap-4 shrink-0 pr-2">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-bold text-gray-800">
                Nearby Stations 
              </h2>
              <span className="bg-green-50 text-[#1BAC4B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {filteredStations.length} Results
              </span>
            </div>
            <div className="flex-grow overflow-y-auto px-2 custom-scrollbar space-y-4">
              {filteredStations.map((station) => (
                <StationListItem
                  key={station._id}
                  station={station}
                  onClick={() => setSelectedStation(station)}
                  distance={station.distance}
                />
              ))}
            </div>
          </aside>
        </div>

        {/* Bottom Section: Quick Actions */}
        <div className="flex flex-col gap-4 mt-2">
          <h2 className="text-lg font-bold text-gray-800 px-2">
            Quick Actions
          </h2>
          <div className="flex gap-4">
            <QuickActionCard
              icon={MapIcon}
              title="Trip Planner"
              desc="Plan your EV journey"
              onClick={() => navigate("/trip-planner")}
            />
            <QuickActionCard
              icon={RouteIcon}
              title="Find Routes"
              desc="Optimize your travel"
              onClick={() => console.log("Find Routes clicked")}
            />
            <QuickActionCard
              icon={Heart}
              title="Favorites"
              desc="Saved charging points"
              onClick={() => console.log("Favorites clicked")}
            />
            <QuickActionCard
              icon={Clock}
              title="History"
              desc="Recent charging sessions"
              onClick={() => console.log("History clicked")}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DiscoveryPage;
