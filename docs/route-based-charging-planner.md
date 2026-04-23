# Route-Based Charging Planner

## 1. How to Get Route Using Leaflet

- Use the [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/) plugin.
- Example:

  ```js
  import L from "leaflet";
  import "leaflet-routing-machine";

  L.Routing.control({
    waypoints: [L.latLng(startLat, startLng), L.latLng(endLat, endLng)],
    routeWhileDragging: true,
  }).addTo(map);
  ```

- This will display the route and provide access to the route’s coordinates.

---

## 2. How to Find Stations Along Route

- After getting the route, extract the polyline (array of coordinates).
- For each station in your DB, use MongoDB’s `$geoNear` or `$geoWithin` with a buffer (e.g., 2km) around the route.
- Example query:
  ```js
  db.stations.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 2000, // meters
      },
    },
  });
  ```
- For efficiency, sample points along the route every 1-2 km and check for stations near those points.

---

## 3. Battery Range Calculation

- Formula:
  $$
  \text{Range (km)} = \text{Battery Capacity (kWh)} \times \text{Efficiency (km/kWh)} \times \frac{\text{Current \%}}{100}
  $$
- Example:
  - Battery: 40 kWh
  - Efficiency: 6 km/kWh
  - Current: 60%
  - Range = 40 × 6 × 0.6 = 144 km

---

## 4. Stop Suggestion Logic

- Calculate total trip distance.
- Simulate driving along the route:
  - Subtract range after each segment.
  - When remaining range < buffer (e.g., 20 km), suggest the nearest available station along the route.
- Prioritize:
  - Stations with available chargers
  - Fast chargers if possible
  - Evenly spaced stops to minimize detours and waiting
- Mark “reachable” and “recommended” stations on the map.
