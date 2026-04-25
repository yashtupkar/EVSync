import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
  Circle,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  Navigation,
  Map as MapIcon,
  Layers,
  Plus,
  Minus,
  Zap,
} from "lucide-react";

// Fix Leaflet marker icon issue
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom EV Station Icon
const createStationIcon = (status) =>
  L.divIcon({
    className: "custom-station-icon",
    html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center border-2 ${status === "available" ? "border-[#1BAC4B]" : "border-red-400"}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${status === "available" ? "#1BAC4B" : "#F87171"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 11 2-2-2-2"/><path d="M11 13h4"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 9h.01"/><path d="M15 15h.01"/></svg>
      </div>
      <div class="absolute -top-1 -right-1 w-3 h-3 ${status === "available" ? "bg-[#1BAC4B]" : "bg-red-400"} rounded-full border-2 border-white"></div>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// User Location Icon
const userIcon = L.divIcon({
  className: "user-location-icon",
  html: `
    <div class="relative">
      <div class="w-6 h-6 bg-[#1BAC4B] rounded-full border-4 border-white shadow-lg animate-pulse"></div>
      <div class="absolute -inset-2 bg-[#1BAC4B]/20 rounded-full animate-ping"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map View Controller
const MapController = ({ center, isSimulating }) => {
  const map = useMap();
  const lastCenter = useRef(null);

  useEffect(() => {
    if (!center) return;

    const zoom = isSimulating ? 17 : map.getZoom();

    // Only set view if center has moved significantly or simulation just started
    const centerKey = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;
    if (centerKey !== lastCenter.current) {
      map.setView(center, zoom, {
        animate: true,
        duration: 0.5,
      });
      lastCenter.current = centerKey;
    }
  }, [center, isSimulating, map]);
  return null;
};

// Helper: Find a preferred English voice for TTS (female preferred, fallback to any English)
function getPreferredEnglishVoice() {
  const voices = window.speechSynthesis.getVoices();
  // Try to find a female English voice
  let voice = voices.find(
    (v) => v.lang.startsWith("en") && v.gender === "female",
  );
  if (!voice)
    voice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"),
    );
  if (!voice) voice = voices.find((v) => v.lang.startsWith("en"));
  if (!voice && voices.length > 0) voice = voices[0];
  return voice;
}

const MapComponent = ({
  stations = [],
  onStationSelect,
  destination,
  hideControls,
  searchQuery,
  onSearchChange,
}) => {
  const [userLocation, setUserLocation] = useState([23.2599, 77.4126]); // Default Bhopal
  const [routeCoords, setRouteCoords] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simMarkerPos, setSimMarkerPos] = useState(null);
  const [simInterval, setSimInterval] = useState(null);
  const mapRef = useRef(null);
  // TTS: Speak a navigation instruction
  const speakInstruction = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new window.SpeechSynthesisUtterance(text);
    // Ensure voices are loaded (async on some browsers)
    let voice = getPreferredEnglishVoice();
    if (!voice) {
      window.speechSynthesis.onvoiceschanged = () => {
        voice = getPreferredEnglishVoice();
        if (voice) utter.voice = voice;
        utter.rate = 1.05;
        utter.pitch = 1.1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      };
    } else {
      utter.voice = voice;
      utter.rate = 1.05;
      utter.pitch = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  };

  // When currentStep changes, speak the instruction
  useEffect(() => {
    if (
      instructions.length > 0 &&
      currentStep < instructions.length &&
      simulating
    ) {
      speakInstruction(instructions[currentStep].maneuver.instruction);
    }
    // eslint-disable-next-line
  }, [currentStep, simulating]);

  // Simulate drive: animate marker and advance steps
  useEffect(() => {
    if (!simulating || !routeCoords.length || !instructions.length) return;
    let stepIdx = 0;
    let coordIdx = 0;
    let intervalId = null;

    // Precompute step ranges in routeCoords
    let currentIdx = 0;
    const stepRanges = instructions.map((step) => {
      // If OSRM provides way_points (e.g. via leaflet-routing-machine), use them
      if (step.way_points) {
        return [step.way_points[0], step.way_points[1]];
      }

      // Fallback: match step geometry to find indices in routeCoords
      const stepCoords = step.geometry?.coordinates;
      if (!stepCoords || stepCoords.length === 0) {
        return [currentIdx, currentIdx];
      }

      const start = currentIdx;
      // Find where the last coordinate of this step matches in routeCoords
      // OSRM coordinates are [lng, lat], routeCoords are [lat, lng]
      const lastCoord = [
        stepCoords[stepCoords.length - 1][1],
        stepCoords[stepCoords.length - 1][0],
      ];

      let end = currentIdx;
      for (let i = currentIdx; i < routeCoords.length; i++) {
        if (
          Math.abs(routeCoords[i][0] - lastCoord[0]) < 0.0001 &&
          Math.abs(routeCoords[i][1] - lastCoord[1]) < 0.0001
        ) {
          end = i;
          break;
        }
      }

      currentIdx = end;
      return [start, end];
    });

    setSimMarkerPos(routeCoords[0]);
    setCurrentStep(0);

    intervalId = setInterval(() => {
      // Move marker along the route
      if (stepIdx >= stepRanges.length) {
        setSimMarkerPos(routeCoords[routeCoords.length - 1]);
        setSimulating(false);
        clearInterval(intervalId);
        setSimInterval(null);
        return;
      }
      const [start, end] = stepRanges[stepIdx];
      if (coordIdx < end) {
        setSimMarkerPos(routeCoords[coordIdx]);
        coordIdx += 1;
      } else {
        setCurrentStep(stepIdx + 1);
        stepIdx += 1;
        coordIdx =
          stepIdx < stepRanges.length
            ? stepRanges[stepIdx][0]
            : routeCoords.length - 1;
      }
    }, 500); // Adjust speed here
    setSimInterval(intervalId);

    return () => {
      clearInterval(intervalId);
      setSimInterval(null);
    };
    // eslint-disable-next-line
  }, [simulating]);

  // Stop simulation on unmount
  useEffect(() => {
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
    // eslint-disable-next-line
  }, []);

  // Start simulation handler
  const handleStartSimulation = () => {
    setSimulating(true);
    setCurrentStep(0);
    setSimMarkerPos(routeCoords[0]);
  };

  // Stop simulation handler
  const handleStopSimulation = () => {
    setSimulating(false);
    setSimMarkerPos(null);
    setCurrentStep(0);
    if (simInterval) clearInterval(simInterval);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Bhopal bounds approx
          const isNearBhopal =
            latitude > 22 && latitude < 24 && longitude > 76 && longitude < 79;
          if (isNearBhopal) {
            setUserLocation([latitude, longitude]);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  // Fetch route from OSRM API when destination changes
  useEffect(() => {
    const fetchRoute = async () => {
      if (!destination) {
        setRouteCoords([]);
        setInstructions([]);
        return;
      }
      const start = userLocation;
      const end = [
        destination.location.coordinates[1],
        destination.location.coordinates[0],
      ];
      const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng],
          );
          setRouteCoords(coords);
          // Flatten all steps from all legs
          const steps = data.routes[0].legs.flatMap((leg) => leg.steps);
          // Debug: Log steps for inspection
          console.log("Navigation steps:", steps);
          setInstructions(steps);
        } else {
          setRouteCoords([]);
          setInstructions([]);
          // Debug: Log missing route/steps
          console.warn("No route or steps found in OSRM response", data);
        }
      } catch (e) {
        setRouteCoords([]);
        setInstructions([]);
        console.error("Error fetching route from OSRM:", e);
      }
    };
    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, userLocation]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={userLocation}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Stations */}
        {stations.map((station) => (
          <Marker
            key={station._id}
            position={[
              station.location.coordinates[1],
              station.location.coordinates[0],
            ]}
            icon={createStationIcon(
              station.chargers?.some((c) => c.status === "available")
                ? "available"
                : "busy",
            )}
            eventHandlers={{
              click: () => onStationSelect(station),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-gray-800">{station.name}</h3>
                <p className="text-xs text-gray-500">{station.address}</p>
                <div className="flex gap-2 mt-2">
                  <span className="bg-green-100 text-[#1BAC4B] px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {station.chargers?.[0]?.power}kW
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Location or Simulated Marker */}
        {!simulating && (
          <Marker position={userLocation} icon={userIcon} zIndexOffset={1000} />
        )}
        {simulating && simMarkerPos && (
          <Marker position={simMarkerPos} icon={userIcon} zIndexOffset={1000} />
        )}

        {/* User Range Circle (Visual only) */}
        <Circle
          center={userLocation}
          radius={2000}
          pathOptions={{
            color: "#1BAC4B",
            fillColor: "#1BAC4B",
            fillOpacity: 0.1,
            weight: 1,
            dashArray: "5, 10",
          }}
        />

        {/* Route Polyline from OSRM */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: "#1BAC4B",
              weight: 6,
              opacity: 0.8,
              lineJoin: "round",
              lineCap: "round",
            }}
          />
        )}

        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Map Overlays */}
      {!hideControls && (
        <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col gap-4 pointer-events-none">
          {/* Search Bar */}
          <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border border-white flex items-center gap-3 w-full max-w-md pointer-events-auto">
            <div className="bg-[#1BAC4B] p-2.5 rounded-2xl text-white shadow-lg shadow-green-100">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search charging stations..."
              className="flex-grow bg-transparent border-none outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button className="p-2.5 text-gray-400 hover:text-[#1BAC4B] transition-colors">
              <Layers size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Google Maps-like Navigation Overlay */}
      {instructions.length > 0 && (
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-[1000] w-full max-w-xl pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white pointer-events-auto flex flex-col items-center">
            {/* Current Step */}
            {instructions[currentStep] && (
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0 bg-primary/10 rounded-2xl p-3">
                  {/* Maneuver icon (simple) */}
                  <span role="img" aria-label="direction">
                    {(() => {
                      const type = instructions[currentStep].maneuver.type;
                      if (type.includes("left")) return "⬅️";
                      if (type.includes("right")) return "➡️";
                      if (type.includes("arrive")) return "🏁";
                      if (type.includes("depart")) return "🚗";
                      if (type.includes("roundabout")) return "⭕";
                      return "⬆️";
                    })()}
                  </span>
                </div>
                <div className="flex-grow">
                  <div className="text-lg font-bold text-gray-900">
                    {instructions[currentStep].maneuver.instruction}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Step {currentStep + 1} of {instructions.length} &middot;{" "}
                    {Math.round(instructions[currentStep].distance)} m &middot;{" "}
                    {Math.round(instructions[currentStep].duration)} sec
                  </div>
                </div>
                <button
                  onClick={() =>
                    speakInstruction(
                      instructions[currentStep].maneuver.instruction,
                    )
                  }
                  className="ml-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200"
                  title="Repeat instruction"
                >
                  🔊
                </button>
                {simulating ? (
                  <button
                    onClick={handleStopSimulation}
                    className="ml-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-xs hover:bg-red-200"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={handleStartSimulation}
                    className="ml-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-200"
                  >
                    Simulate Drive
                  </button>
                )}
              </div>
            )}
            {/* Step List (collapsed, can expand if needed) */}
            <details className="w-full mt-2">
              <summary className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-widest cursor-pointer">
                Show All Steps
              </summary>
              <ol className="text-sm text-gray-800 space-y-1 mt-2">
                {instructions.map((step, idx) => (
                  <li
                    key={idx}
                    className={
                      idx === currentStep ? "font-bold text-primary" : ""
                    }
                  >
                    {step.maneuver.instruction}
                  </li>
                ))}
              </ol>
            </details>
          </div>
        </div>
      )}

      {/* Error message if no navigation steps found but destination is set */}
      {destination && instructions.length === 0 && (
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-[1000] w-full max-w-xl pointer-events-none">
          <div className="bg-red-100 text-red-700 p-4 rounded-3xl shadow-2xl border border-red-200 pointer-events-auto flex flex-col items-center">
            <span className="font-bold">
              No navigation steps found for this route.
            </span>
            <span className="text-xs mt-1">
              Try a different destination or check your internet connection.
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      {!hideControls && (
        <div className="absolute right-6 bottom-32 z-[1000] flex flex-col gap-3">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="bg-white p-4 rounded-2xl shadow-xl text-gray-600 hover:text-[#1BAC4B] hover:shadow-2xl transition-all border border-white"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="bg-white p-4 rounded-2xl shadow-xl text-gray-600 hover:text-[#1BAC4B] hover:shadow-2xl transition-all border border-white"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={() => {
              if (userLocation) {
                mapRef.current?.setView(userLocation, 15);
              }
            }}
            className="bg-[#1BAC4B] p-4 rounded-2xl shadow-xl text-white hover:bg-[#189a43] hover:shadow-2xl transition-all shadow-green-100"
          >
            <Navigation size={20} />
          </button>
        </div>
      )}

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 20px;
          padding: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
