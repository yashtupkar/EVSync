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
  Map as MapIcon,
  Layers,
  Plus,
  Minus,
  Zap,
  LocateFixed,
  MapPin,
  Loader2,
  History,
  Star,
  Bookmark,
  Navigation,
  Heart,
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
const createStationIcon = (station, mapRotation = 0) => {
  const isAvailable =
    station?.status === "available" || station?.isAvailable !== false;
  const color = isAvailable ? "#1BAC4B" : "#EF4444";

  return L.divIcon({
    className: "custom-station-icon",
    html: `
      <div class="relative transition-transform duration-500" style="transform: rotate(${-mapRotation}deg)">
        <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
          <path d="M18 42C18 42 36 28.5 36 18C36 8.05888 27.9411 0 18 0C8.05888 0 0 8.05888 0 18C0 28.5 18 42 18 42Z" fill="white"/>
          <path d="M18 39.5C18 39.5 33 26.5 33 18C33 9.71573 26.2843 3 18 3C9.71573 3 3 9.71573 3 18C3 26.5 18 39.5 18 39.5Z" fill="${color}"/>
          <circle cx="18" cy="18" r="12" fill="white"/>
          <path d="M19 8L10 20H17L16 28L25 16H18L19 8Z" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
  });
};

// User Location Icon (Google Maps Style)
const userIcon = (rotation = 0, mapRotation = 0) =>
  L.divIcon({
    className: "user-location-icon",
    html: `
    <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
      <!-- Pulsing Effect -->
      <div class="absolute w-8 h-8 bg-[#4285F4]/20 rounded-full animate-ping"></div>
      
   

      <!-- Center Blue Dot -->
      <div class="relative w-5 h-5 bg-[#4285F4] rounded-full border-[3px] border-white shadow-[0_0_10px_rgba(66,133,244,0.5)] z-10"></div>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// Destination Icon (Paper Pin / Pushpin style)
const destinationIcon = (mapRotation = 0) =>
  L.divIcon({
    className: "destination-icon",
    html: `
    <div class="relative transition-transform duration-500" style="transform: rotate(${-mapRotation}deg)">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
        <!-- The Pin Needle -->
        <path d="M16 32L16 16" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
        <!-- The Pin Head (Paper Pin Style) -->
        <circle cx="16" cy="12" r="10" fill="white"/>
        <circle cx="16" cy="12" r="8" fill="#EF4444"/>
        <circle cx="14" cy="10" r="3" fill="white" fill-opacity="0.4"/>
        <!-- Bottom Shadow -->
        <ellipse cx="16" cy="32" rx="4" ry="1.5" fill="black" fill-opacity="0.2"/>
      </svg>
    </div>
  `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

// Start Location Icon (Paper Pin / Pushpin style)
const startIcon = (mapRotation = 0) =>
  L.divIcon({
    className: "start-location-icon",
    html: `
    <div class="relative transition-transform duration-500" style="transform: rotate(${-mapRotation}deg)">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
        <!-- The Pin Needle -->
        <path d="M16 32L16 16" stroke="#4285F4" stroke-width="2" stroke-linecap="round"/>
        <!-- The Pin Head (Paper Pin Style) -->
        <circle cx="16" cy="12" r="10" fill="white"/>
        <circle cx="16" cy="12" r="8" fill="#4285F4"/>
        <circle cx="14" cy="10" r="3" fill="white" fill-opacity="0.4"/>
        <!-- Bottom Shadow -->
        <ellipse cx="16" cy="32" rx="4" ry="1.5" fill="black" fill-opacity="0.2"/>
      </svg>
    </div>
  `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

// Helper: Calculate bearing between two points
const calculateBearing = (start, end) => {
  if (!start || !end) return 0;
  const startLat = (start[0] * Math.PI) / 180;
  const startLng = (start[1] * Math.PI) / 180;
  const endLat = (end[0] * Math.PI) / 180;
  const endLng = (end[1] * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

// Helper: Get distance with units
const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// Helper: Get duration with units
const formatDuration = (seconds) => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return hours > 0 ? `${hours}h ${remainingMins}m` : `${mins} min`;
};

// Map View Controller
const MapController = ({
  center,
  isSimulating,
  bearing = 0,
  isFollowing,
  setIsFollowing,
}) => {
  const map = useMap();
  const lastCenter = useRef(null);
  const isSimulationStarted = useRef(false);

  useEffect(() => {
    const onDragStart = () => {
      if (isSimulating) {
        setIsFollowing(false);
      }
    };
    map.on("dragstart", onDragStart);
    return () => map.off("dragstart", onDragStart);
  }, [map, isSimulating, setIsFollowing]);

  useEffect(() => {
    if (!center) return;

    if (isSimulating) {
      // Set initial zoom for simulation if not already set
      if (!isSimulationStarted.current) {
        map.setView(center, 15, { animate: true });
        isSimulationStarted.current = true;
        setIsFollowing(true);
        return;
      }

      // Only snap to center if we are in "following" mode
      if (isFollowing) {
        map.setView(center, map.getZoom(), {
          animate: false,
        });
      }
    } else {
      isSimulationStarted.current = false;
      // Normal view: smooth transition
      const centerKey = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;
      if (centerKey !== lastCenter.current) {
        map.setView(center, map.getZoom(), {
          animate: true,
          duration: 0.5,
        });
        lastCenter.current = centerKey;
      }
    }
  }, [center, isSimulating, map]);

  useEffect(() => {
    const container = map.getContainer();
    if (isSimulating) {
      container.style.transition = "transform 0.5s ease-in-out";
      container.style.transform = `rotate(${-bearing}deg) scale(1.4)`;
    } else {
      container.style.transition = "transform 0.5s ease-in-out";
      container.style.transform = "rotate(0deg) scale(1)";
    }
  }, [bearing, isSimulating, map]);

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

// Helper: Generate human-readable instruction from OSRM step
const getInstruction = (step) => {
  if (step.maneuver.instruction) return step.maneuver.instruction;

  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier || "";
  const name = step.name || "";
  const roadName = name ? `onto ${name}` : "";

  switch (type) {
    case "depart":
      return `Head ${modifier} ${roadName}`.trim();
    case "turn":
      return `Turn ${modifier} ${roadName}`.trim();
    case "merge":
      return `Merge ${roadName}`.trim();
    case "on ramp":
      return `Take the ramp ${roadName}`.trim();
    case "off ramp":
      return `Take the exit ${roadName}`.trim();
    case "fork":
      return `Keep ${modifier} at the fork ${roadName}`.trim();
    case "end of road":
      return `Turn ${modifier} at the end of the road ${roadName}`.trim();
    case "continue":
      return `Continue ${roadName}`.trim();
    case "roundabout":
      return `At the roundabout, take the exit ${roadName}`.trim();
    case "arrive":
      return "You have arrived at your destination";
    default:
      return `${type} ${modifier} ${roadName}`.trim();
  }
};

const TripPlannerMap = ({
  stations = [],
  onStationSelect,
  destination,
  startLocation,
  hideControls,
  searchQuery,
  onSearchChange,
  hideSearch = false,
  showRoute = true,
  onRouteUpdate,
  usePaperPins = false,
  routeTrigger = 0,
  waypoints = [], // Array of {lat, lng} or station objects with coordinates
}) => {
  const [userLocation, setUserLocation] = useState(
    startLocation || [23.2599, 77.4126],
  ); // Default Bhopal

  useEffect(() => {
    if (startLocation) {
      setUserLocation(startLocation);
    }
  }, [startLocation]);
  const [mapStyle, setMapStyle] = useState("default"); // 'default', 'satellite', 'terrain', 'modern'
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const mapStyles = {
    default: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      label: "Default",
    },
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      label: "Street Map",
    },
    modern: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      label: "Modern",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      label: "Satellite",
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      label: "Terrain",
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      label: "Dark Mode",
    },
    night: {
      url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      label: "Night View",
    },

    retro: {
      url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
      label: "Retro",
    },
  };
  const [routeCoords, setRouteCoords] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simMarkerPos, setSimMarkerPos] = useState(null);
  const [bearing, setBearing] = useState(0);
  const bearingRef = useRef(0);
  const [simInterval, setSimInterval] = useState(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const mapRef = useRef(null);
  const lastSpokenStep = useRef(-1);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const { lat, lon } = suggestion;
    if (mapRef.current) {
      mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 14, {
        animate: true,
        duration: 1.5,
      });
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // TTS: Speak a navigation instruction
  const speakInstruction = (text) => {
    if (!window.speechSynthesis || !text) return;

    const speak = () => {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      const voice = getPreferredEnglishVoice();
      if (voice) utter.voice = voice;
      utter.rate = 0.9;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      window.speechSynthesis.speak(utter);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  // When currentStep changes, speak the instruction
  useEffect(() => {
    if (
      instructions.length > 0 &&
      currentStep < instructions.length &&
      simulating &&
      currentStep !== lastSpokenStep.current
    ) {
      const step = instructions[currentStep];
      const text = getInstruction(step);
      speakInstruction(text);
      lastSpokenStep.current = currentStep;
    }
    // eslint-disable-next-line
  }, [currentStep, simulating]);

  // Simulate drive: animate marker and advance steps
  useEffect(() => {
    if (!simulating || !routeCoords.length || !instructions.length) return;
    // Find the closest point in routeCoords to current simMarkerPos to continue simulation
    let startStepIdx = 0;
    let startCoordIdx = 0;

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

    if (simMarkerPos && routeCoords.length > 0) {
      let minDistance = Infinity;
      routeCoords.forEach((coord, i) => {
        const dist = calculateDistance(
          simMarkerPos[0],
          simMarkerPos[1],
          coord[0],
          coord[1],
        );
        if (dist < minDistance) {
          minDistance = dist;
          startCoordIdx = i;
        }
      });
    }

    let intervalId = null;
    let stepIdx = startStepIdx;
    let coordIdx = startCoordIdx;

    // Find which step this coordinate belongs to
    for (let i = 0; i < stepRanges.length; i++) {
      if (
        startCoordIdx >= stepRanges[i][0] &&
        startCoordIdx <= stepRanges[i][1]
      ) {
        stepIdx = i;
        break;
      }
    }

    setSimMarkerPos(routeCoords[startCoordIdx]);
    setCurrentStep(stepIdx);

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
        const currentPos = routeCoords[coordIdx];
        const nextPos = routeCoords[coordIdx + 1] || routeCoords[coordIdx];

        // Calculate the raw target bearing (0-360)
        let targetBearing = calculateBearing(currentPos, nextPos);

        // If we just started a step, use the maneuver's bearing_after if available for better stability
        if (
          coordIdx === start &&
          instructions[stepIdx]?.maneuver?.bearing_after !== undefined
        ) {
          targetBearing = instructions[stepIdx].maneuver.bearing_after;
        }

        // Shortest path rotation logic:
        // We want to go from bearingRef.current to targetBearing without spinning 360 degrees.
        let diff = targetBearing - (bearingRef.current % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        const newAbsoluteBearing = bearingRef.current + diff;
        bearingRef.current = newAbsoluteBearing;
        setBearing(newAbsoluteBearing);

        setSimMarkerPos(currentPos);
        coordIdx += 1;
      } else {
        setCurrentStep(stepIdx + 1);
        stepIdx += 1;
        coordIdx =
          stepIdx < stepRanges.length
            ? stepRanges[stepIdx][0]
            : routeCoords.length - 1;
      }
    }, 400); // Adjust speed here
    setSimInterval(intervalId);

    return () => {
      clearInterval(intervalId);
      setSimInterval(null);
    };
    // eslint-disable-next-line
  }, [simulating, routeCoords, instructions]);

  // Stop simulation on unmount
  useEffect(() => {
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
    // eslint-disable-next-line
  }, []);

  // Start simulation handler
  const handleStartSimulation = () => {
    // Close any open popups to ensure clear view
    if (mapRef.current) {
      mapRef.current.closePopup();
    }

    setSimulating(true);
    setCurrentStep(0);
    lastSpokenStep.current = -1;
    setBearing(0);
    bearingRef.current = 0;
    setSimMarkerPos(routeCoords[0]);
    setIsFollowing(true);
  };

  // Stop simulation handler
  const handleStopSimulation = () => {
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
    setSimulating(false);
    setSimMarkerPos(null);
    setBearing(0);
    bearingRef.current = 0;
    setCurrentStep(0);
    if (simInterval) clearInterval(simInterval);
  };

  useEffect(() => {
    // Only auto-locate if no startLocation is provided
    if (!startLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, [startLocation]);

  // Fetch route from OSRM API when destination changes
  useEffect(() => {
    const fetchRoute = async () => {
      // Clear previous route if missing essential data
      if (!destination || !showRoute || !userLocation) {
        setRouteCoords([]);
        setInstructions([]);
        setRouteInfo(null);
        setIsLoadingRoute(false);
        if (onRouteUpdate) onRouteUpdate(null);
        return;
      }

      setIsLoadingRoute(true);
      try {
        // Use current simulation position as start if we're mid-trip
        const start = simulating && simMarkerPos ? simMarkerPos : userLocation;

        // Handle different destination formats
        let endLat, endLng;
        if (destination.location?.coordinates) {
          endLat = destination.location.coordinates[1];
          endLng = destination.location.coordinates[0];
        } else if (destination.lat && destination.lng) {
          endLat = destination.lat;
          endLng = destination.lng;
        } else {
          console.warn("MapComponent: Invalid destination format", destination);
          throw new Error("Invalid destination format");
        }

        const end = [endLat, endLng];

        // Construct waypoints string
        const waypointsStr = waypoints
          .map((wp) => {
            const lat = wp.location?.coordinates
              ? wp.location.coordinates[1]
              : wp.lat;
            const lng = wp.location?.coordinates
              ? wp.location.coordinates[0]
              : wp.lng;
            return `${lng},${lat}`;
          })
          .join(";");

        const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start[1]},${start[0]};${waypointsStr ? waypointsStr + ";" : ""}${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

        console.log("MapComponent: Fetching route from", url);

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`OSRM API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);

          setRouteCoords(coords);
          const steps = route.legs.flatMap((leg) => leg.steps);
          setInstructions(steps);

          const info = {
            distance: route.distance,
            duration: route.duration,
          };
          setRouteInfo(info);

          if (onRouteUpdate) {
            onRouteUpdate({
              distance: route.distance,
              duration: route.duration,
              coordinates: coords,
              instructions: steps,
            });
          }
        } else {
          console.warn("MapComponent: No route found", data);
          setRouteCoords([]);
          setInstructions([]);
          setRouteInfo(null);
          if (onRouteUpdate) onRouteUpdate(null);
        }
      } catch (e) {
        console.error("MapComponent: Error fetching route:", e);
        setRouteCoords([]);
        setInstructions([]);
        setRouteInfo(null);
        if (onRouteUpdate) onRouteUpdate(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [
    destination,
    userLocation,
    showRoute,
    routeTrigger,
    waypoints,
    simulating,
  ]);

  // Adjust map bounds to fit both locations when route is shown
  useEffect(() => {
    if (showRoute && destination && userLocation && mapRef.current) {
      const start = userLocation;

      let endLat, endLng;
      if (destination.location?.coordinates) {
        endLat = destination.location.coordinates[1];
        endLng = destination.location.coordinates[0];
      } else if (destination.lat && destination.lng) {
        endLat = destination.lat;
        endLng = destination.lng;
      } else {
        return;
      }

      const end = [endLat, endLng];
      const bounds = L.latLngBounds([start, end]);
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        animate: true,
        duration: 1.5,
      });
    }
    // Re-fit when showRoute changes to true or when routeTrigger is incremented
    // But don't auto-fit if we're already simulating (keep user's focus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRoute, destination, userLocation, routeTrigger, simulating]);

  return (
    <div className="w-full h-full   relative overflow-hidden bg-[#f8fafc]">
      <MapContainer
        center={userLocation}
        zoom={13}
        className="w-full h-full transition-all  duration-500"
        zoomControl={false}
        ref={mapRef}
        style={{ background: "#f8fafc" }}
      >
        <TileLayer
          url={mapStyles[mapStyle].url}
          attribution={mapStyles[mapStyle].attribution}
        />

        <MapController
          center={simulating ? simMarkerPos : userLocation}
          isSimulating={simulating}
          bearing={bearing}
          isFollowing={isFollowing}
          setIsFollowing={setIsFollowing}
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
              {
                ...station,
                isAvailable: station.chargers?.some(
                  (c) => c.status === "available",
                ),
              },
              simulating ? bearing : 0,
            )}
            eventHandlers={{
              mouseover: (e) => e.target.openPopup(),
              mouseout: (e) => e.target.closePopup(),
              click: () => onStationSelect(station),
            }}
          >
            <Popup
              className="station-rich-popup"
              closeButton={false}
              autoPan={false}
            >
              <div className="w-[300px] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col group">
                {/* Image Section */}
                <div className="h-32 w-full relative overflow-hidden">
                  <img
                    src={
                      station.images?.[0] ||
                      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"
                    }
                    alt={station.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col gap-1 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow pr-12">
                      <h3 className="font-bold text-gray-800 text-base leading-tight line-clamp-2">
                        {station.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-bold text-gray-700">
                          {station.rating || "4.3"}
                        </span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={
                                i < Math.floor(station.rating || 4)
                                  ? "currentColor"
                                  : "none"
                              }
                              strokeWidth={2}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          ({station.reviewsCount || "6"})
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute right-4 top-4 flex flex-col gap-2">
                      <button className="w-10 h-10 bg-blue-50 text-[#1A73E8] rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm">
                        <Navigation
                          size={20}
                          fill="currentColor"
                          className="rotate-45"
                        />
                      </button>
                      <button className="w-10 h-10 bg-blue-50 text-[#1A73E8] rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm">
                        <Bookmark size={20} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs font-medium mt-1">
                    Electric vehicle charging station
                  </p>

                  <div className="flex items-center gap-1.5 mt-1 text-[#1BAC4B]">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Open 24 hours
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Location or Simulated Marker */}
        {!simulating && (
          <Marker
            position={userLocation}
            icon={startLocation ? startIcon(0) : userIcon(0, 0)}
            zIndexOffset={1000}
          >
            {startLocation && (
              <Popup className="custom-popup">
                <div className="p-2 text-center">
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">
                    Start Point
                  </div>
                  <div className="text-xs font-bold text-gray-800">
                    Your journey starts here
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        )}
        {simulating && simMarkerPos && (
          <Marker
            position={simMarkerPos}
            icon={userIcon(bearing, bearing)}
            zIndexOffset={1000}
          />
        )}

        {/* Destination Marker */}
        {usePaperPins && destination && (
          <Marker
            position={[
              destination.location.coordinates[1],
              destination.location.coordinates[0],
            ]}
            icon={destinationIcon(simulating ? bearing : 0)}
            zIndexOffset={500}
          >
            <Popup className="custom-popup">
              <div className="p-2 text-center">
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
                  Destination
                </div>
                <div className="text-xs font-bold text-gray-800">
                  Your trip ends here
                </div>
              </div>
            </Popup>
          </Marker>
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

        <Polyline
          positions={routeCoords}
          pathOptions={{
            color:
              mapStyle === "satellite" ||
              mapStyle === "dark" ||
              mapStyle === "night"
                ? "#FDB813"
                : "#4285F4",
            weight: 6,
            opacity: 0.8,
            lineJoin: "round",
            lineCap: "round",
          }}
        />

        {/* <ZoomControl position="bottomright" /> */}
      </MapContainer>

      {/* Unified Bottom Bar Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-[1001] pointer-events-none px-4 pb-6 md:pb-8">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          {/* Top Row: Floating Controls (Zoom & Layers) - Positioned above the bar */}
          {!hideControls && (
            <div className="flex items-end justify-between px-2 pointer-events-none">
              {/* Left side: Compass (Moved here from top) */}
              <div className="bg-white/90 backdrop-blur-xl p-2.5 rounded-full shadow-2xl border border-white pointer-events-auto flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center relative">
                  <div className="absolute inset-0 border-[1.5px] border-gray-100 rounded-full"></div>
                  <span className="absolute -top-1 text-[6px] font-black text-red-500">
                    N
                  </span>
                  <div
                    className="w-0.5 h-6 relative flex flex-col items-center transition-transform duration-300"
                    style={{ transform: `rotate(${-bearing}deg)` }}
                  >
                    <div className="w-1 h-3 bg-red-500 rounded-t-full shadow-sm"></div>
                    <div className="w-1 h-3 bg-gray-300 rounded-b-full shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* Right side: Map Controls */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                {userLocation && (
                  <button
                    onClick={() => {
                      if (mapRef.current) {
                        const targetPos = simulating
                          ? simMarkerPos
                          : userLocation;
                        mapRef.current.setView(targetPos, 15, {
                          animate: true,
                        });
                        if (simulating) setIsFollowing(true);
                      }
                    }}
                    className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl text-gray-600 hover:text-[#1BAC4B] transition-all border border-white"
                    title="Find My Location"
                  >
                    <LocateFixed size={20} />
                  </button>
                )}
                <div className="relative">
                  <button
                    className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl text-gray-600 hover:text-[#1BAC4B] transition-all border border-white"
                    onClick={() => setShowStyleMenu(!showStyleMenu)}
                  >
                    <Layers size={20} />
                  </button>
                  {showStyleMenu && (
                    <div className="absolute right-0 bottom-full mb-3 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white overflow-hidden w-48 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="p-3 space-y-1">
                        {Object.entries(mapStyles).map(([key, style]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setMapStyle(key);
                              setShowStyleMenu(false);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl text-xs font-black w-full transition-all ${
                              mapStyle === key
                                ? "bg-[#1BAC4B] text-white"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white overflow-hidden">
                  <button
                    onClick={() => mapRef.current?.zoomIn()}
                    className="p-3.5 text-gray-600 hover:text-[#1BAC4B] hover:bg-gray-50 transition-all border-b border-gray-100"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => mapRef.current?.zoomOut()}
                    className="p-3.5 text-gray-600 hover:text-[#1BAC4B] hover:bg-gray-50 transition-all"
                  >
                    <Minus size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Bar */}
          <div className="pointer-events-auto">
            {showRoute ? (
              /* Navigation Mode */
              <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white overflow-hidden transition-all duration-500">
                {isLoadingRoute ? (
                  <div className="p-5 flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 border-3 border-[#1BAC4B] border-t-transparent rounded-full animate-spin" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">
                        Calculating Route...
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Optimizing your journey
                      </span>
                    </div>
                  </div>
                ) : routeInfo ? (
                  <div className="flex flex-col">
                    {/* Primary Stats & Current Step */}
                    <div className="p-4 flex items-center gap-4">
                      {/* Direction Icon */}
                      <div className="w-12 h-12 bg-[#1BAC4B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">
                          {instructions[currentStep]
                            ? (() => {
                                const type =
                                  instructions[currentStep].maneuver.type;
                                const modifier =
                                  instructions[currentStep].maneuver.modifier ||
                                  "";
                                if (type.includes("arrive")) return "🏁";
                                if (type.includes("depart")) return "🚗";
                                if (modifier.includes("left")) return "⬅️";
                                if (modifier.includes("right")) return "➡️";
                                if (type.includes("roundabout")) return "⭕";
                                return "⬆️";
                              })()
                            : "🚗"}
                        </span>
                      </div>
                      {/* Main Content */}
                      <div className="flex-grow min-w-0">
                        <div className="text-lg font-black text-gray-900 truncate leading-tight">
                          {instructions[currentStep]
                            ? getInstruction(instructions[currentStep])
                            : "Ready to start your journey"}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black text-[#1BAC4B] uppercase tracking-wider">
                            {formatDuration(routeInfo.duration)}
                          </span>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            {formatDistance(routeInfo.distance)}
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowRouteDetails(!showRouteDetails)}
                          className={`p-3 rounded-2xl transition-all ${
                            showRouteDetails
                              ? "bg-[#1BAC4B] text-white"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          <Zap size={18} />
                        </button>
                        {simulating ? (
                          <button
                            onClick={handleStopSimulation}
                            className="px-5 py-3 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all"
                          >
                            Exit
                          </button>
                        ) : (
                          <button
                            onClick={handleStartSimulation}
                            className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-black shadow-lg shadow-gray-200 active:scale-95 transition-all"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Expandable Route Details */}
                    {showRouteDetails && instructions.length > 0 && (
                      <div className="border-t border-gray-50 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 space-y-3">
                          {instructions.map((step, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-4 p-3 rounded-2xl transition-all ${
                                idx === currentStep
                                  ? "bg-[#1BAC4B]/5 border border-[#1BAC4B]/10"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${
                                  idx === currentStep
                                    ? "bg-[#1BAC4B] text-white"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                  {getInstruction(step)}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                                  {formatDistance(step.distance)} •{" "}
                                  {formatDuration(step.duration)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : !hideSearch ? (
              /* Search Mode (Integrated into bottom bar) */
              <div className="relative pointer-events-auto">
                {/* Suggestions Overlay (Pops up from bottom) */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-4 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    <div className="p-3">
                      <div className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 mb-2">
                        Location Results
                      </div>
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-all flex items-start gap-4 rounded-3xl"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <MapPin size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-black text-gray-900 truncate">
                              {suggestion.display_name.split(",")[0]}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 truncate mt-0.5 uppercase tracking-wide">
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
                  </div>
                )}

                <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white p-2 transition-all duration-500">
                  <div className="flex items-center gap-4 px-4 py-2">
                    <div className="w-12 h-12 bg-[#1BAC4B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {isLoadingSuggestions ? (
                        <Loader2
                          size={22}
                          className="text-[#1BAC4B] animate-spin"
                        />
                      ) : (
                        <Search size={22} className="text-[#1BAC4B]" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <input
                        type="text"
                        placeholder="Search stations or places..."
                        className="w-full bg-transparent border-none outline-none text-lg font-black text-gray-900 placeholder:text-gray-300"
                        value={searchQuery}
                        onChange={(e) => {
                          onSearchChange(e.target.value);
                          fetchSuggestions(e.target.value);
                        }}
                        onFocus={() => {
                          if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                      />
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Find EV Charging Stations
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (userLocation && mapRef.current) {
                          mapRef.current.setView(userLocation, 15, {
                            animate: true,
                          });
                        }
                      }}
                      className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition-all active:scale-95"
                    >
                      <LocateFixed size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Error State Overlay */}
      {destination &&
        showRoute &&
        instructions.length === 0 &&
        !routeInfo &&
        !isLoadingRoute && (
          <div className="absolute inset-0 z-[1002] bg-white/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-red-50 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                Unreachable Location
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                We couldn't find a direct route to this destination. Please try
                a different spot.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Reset Map
              </button>
            </div>
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

export default TripPlannerMap;
