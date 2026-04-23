# 🚀 EV Charging Station Locator & Booking System

---

## 1. High-Level Architecture

[Client (React)] <-> [API Gateway (Express.js)] <-> [Services]
| | |
[Leaflet Map] [Socket.io Server] [MongoDB]
| | |
[OpenStreetMap] [OTP Service] [Razorpay]

---

## 2. System Architecture

### Services / Modules

- Auth Service (OTP)
- Station Service (Geo queries)
- Booking Service (Slot logic)
- Charger Service (Status & compatibility)
- Route Planner Service
- Payment Service
- Notification Service (SMS)
- Admin Service (Dashboard & analytics)
- Real-Time Service (Socket.io)

### Data Flow

1. User logs in via OTP → Auth Service
2. User fetches location → Station Service
3. User books charger → Booking Service
4. Real-time updates → Socket.io
5. Payment processed → Payment Service
6. Admin actions → Admin Service

---

## 3. Database Schema (MongoDB + Mongoose)

### User

- `_id`
- `name`
- `mobile (unique)`
- `vehicles: [Vehicle._id]`
- `role: user | admin | station_owner`
- `createdAt, updatedAt`

### Vehicle

- `_id`
- `userId`
- `type: 2W | 3W | 4W`
- `make, model`
- `batteryCapacity (kWh)`
- `connectorTypes`
- `createdAt, updatedAt`

### Station

- `_id`
- `name`
- `location (GeoJSON - 2dsphere)`
- `address`
- `chargers`
- `ownerId`
- `createdAt, updatedAt`

### Charger

- `_id`
- `stationId`
- `power (kW)`
- `connectorType`
- `status: available | reserved | in_use`
- `currentBooking`
- `compatibleVehicles`
- `createdAt, updatedAt`

### Booking

- `_id`
- `userId`
- `vehicleId`
- `chargerId`
- `stationId`
- `startTime, endTime`
- `status: active | cancelled | completed | no_show`
- `cost`
- `paymentId`
- `createdAt, updatedAt`

### Payment

- `_id`
- `userId`
- `bookingId`
- `amount`
- `status: pending | paid | refunded | failed`
- `provider`
- `transactionId`
- `createdAt, updatedAt`

### OTP Store

- `_id`
- `mobile`
- `otp`
- `expiresAt`
- `attempts`
- `verified`
- `createdAt, updatedAt`

---

## 4. API Design (REST)

### Auth APIs

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`

### Station APIs

- `GET /api/stations/nearby`
- `GET /api/stations/:id`
- `POST /api/stations` (Admin)
- `PUT /api/stations/:id` (Admin)
- `DELETE /api/stations/:id` (Admin)

### Charger APIs

- `GET /api/chargers/:id`
- `POST /api/chargers` (Admin)
- `PUT /api/chargers/:id` (Admin)
- `DELETE /api/chargers/:id` (Admin)

### Booking APIs

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/:id`
- `POST /api/bookings/:id/cancel`
- `POST /api/bookings/:id/confirm-arrival`

### Charging APIs

- `POST /api/charging/start`
- `POST /api/charging/stop`

### Admin APIs

- `GET /api/admin/bookings`
- `GET /api/admin/analytics`
- `GET /api/admin/stations`
- `GET /api/admin/chargers`

---

## 5. Booking & Slot Logic

- Time-based booking (`startTime`, `endTime`)
- Overlap detection prevents double booking
- Auto-release if user doesn’t arrive
- Cancellation before start time (refund applied)
- Real-time slot updates via Socket.io

---

## 6. Charging Time Calculation

Charging Time (hours) =
(Battery Capacity × (Target% - Current%) / 100)

(Charger Power × Efficiency)

### Example:

- Battery: 40 kWh
- Current: 20%
- Target: 80%
- Charger: 10 kW
- Efficiency: 0.9

➡️ Charging Time ≈ **2.67 hours**

---

## 7. Route-Based Planner Logic

- User inputs source & destination
- Fetch route via Leaflet
- Calculate vehicle range
- Find stations along route
- Suggest optimal stops based on:
  - Range
  - Availability
  - Minimum stops

---

## 8. User Flow

### Booking Flow

1. Login via OTP
2. Share/select location
3. Choose vehicle & charger
4. View slots, time, cost
5. Book & pay
6. Receive confirmation

### Charging Flow

1. Arrive at station
2. Confirm via OTP/GPS
3. Charging starts
4. Stop charging → status reset

### Trip Planning Flow

1. Enter source & destination
2. Calculate range
3. Suggest stations
4. Book slots

---

## 9. Admin Panel

### Features

- Manage stations & chargers
- View bookings
- Analytics (usage, revenue, peak hours)
- Role-based access

### Dashboard Layout

- Map view of stations
- Tables (chargers, bookings)
- Charts (analytics)
- CRUD actions

---

## 10. Frontend Structure (React)

/src
/components
MapView.jsx
StationList.jsx
BookingForm.jsx
ChargerStatus.jsx
RoutePlanner.jsx
AdminDashboard.jsx
AnalyticsCharts.jsx
NotificationBanner.jsx

/pages
Home.jsx
Login.jsx
Booking.jsx
TripPlanner.jsx
Admin.jsx
Profile.jsx

/services
api.js
socket.js
auth.js
payment.js

/hooks
useGeoLocation.js
useSocket.js

/utils
chargingTime.js
overlapCheck.js

/store
userSlice.js
bookingSlice.js
stationSlice.js

---

## 11. Backend Structure (Node.js)

/src
/controllers
authController.js
stationController.js
chargerController.js
bookingController.js
paymentController.js
adminController.js
/routes
authRoutes.js
stationRoutes.js
chargerRoutes.js
bookingRoutes.js
paymentRoutes.js
adminRoutes.js
/models
User.js
Vehicle.js
Station.js
Charger.js
Booking.js
Payment.js
Otp.js
/services
otpService.js
bookingService.js
paymentService.js
notificationService.js
analyticsService.js
routePlannerService.js
socketService.js
/middlewares
authMiddleware.js
roleMiddleware.js
errorHandler.js
/utils
chargingTime.js
geoUtils.js
overlapCheck.js
/config
db.js
socket.js

---

## 12. Real-Time System (Socket.io)

### Events

- `slot_updated`
- `booking_created`
- `booking_cancelled`
- `charger_status_changed`

### Flow

- Emit events on booking or status change
- Clients subscribe for updates

---

## 13. Edge Cases

- Double booking → Prevent via DB lock
- OTP expiry → Retry limits
- Payment failure → Release slot
- No-show → Auto cancel + refund

---

## 14. Future Enhancements

- AI recommendations
- Real EV API integration
- Dynamic pricing system

---
