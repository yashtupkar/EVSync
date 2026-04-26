# EVSync: Slot Booking, OCPP & Operator Dashboard Architecture

## 1. Slot Booking & Payment Flow

### Booking Rules
- **Instant & Future Slots:** Users can book a slot for right now (instant) or pick an available time slot for later *today*.
- **Platform Fee (Anti-Cheating):** When booking, the user pays a ₹30 platform/reservation fee via Razorpay. 
- **Adjustment:** This fee is stored in the database as a "credit" for that specific session and will be deducted from their final charging bill.

### Arrival & Verification (Handshake)
- **Geofencing:** (Optional) The "I have arrived" button in the app only unlocks if the user's GPS is within 50m of the station.
- **Verification Method (QR / OTP):**
  - **QR Scan:** The user scans a QR code pasted on the charger. The app verifies the QR payload matches the `stationId` of their booking.
  - **OTP Alternative:** The user gets a 4-digit PIN in the app. The Station Operator or the smart charger interface verifies this PIN to begin charging.

## 2. Real-time Charging & Billing (OCPP Integration)

Because the stations are unmanned, the system relies on the **Open Charge Point Protocol (OCPP)**.
1. **Initiate:** Upon successful QR/OTP scan, the Node.js backend sends a `RemoteStartTransaction` command via OCPP to the charger.
2. **Monitoring:** The charger sends `MeterValues` (e.g., kWh consumed, current voltage) every 10 seconds. The backend relays this to the frontend via Socket.io so the user sees a live "Charging..." animation.
3. **Completion:** When the battery is full or the user stops it from the app, the backend sends `RemoteStopTransaction`.
4. **Billing Calculation:**
   - **Formula:** `(Total kWh * Rate per Unit) - Platform Fee (₹30)`
   - The user's saved card or wallet is charged for the remaining balance.

## 3. Hackathon Demo Simulator

To demonstrate this end-to-end without physical hardware, a **Node.js OCPP Simulator script** will be used.
- **Purpose:** Acts as a fake charging station.
- **How it works:** When a booking is triggered from the frontend, the backend tells the simulator to start. The simulator uses `setInterval` to emit fake `MeterValues` (increasing kWh) via WebSockets back to the backend.
- **Presentation:** A side-by-side view where the User App shows live charging stats, while the terminal runs the simulator script acting like the physical machine.

## 4. Station Operator Dashboard & Role-Based Access

A dedicated, protected panel for station owners to manage their assets, guarded by Role-Based Access Control (RBAC).

### Roles
- **User:** Standard user who can discover stations, plan trips, and book slots.
- **Operator:** A station owner who can access the Operator Dashboard.
- **Admin:** Superuser who can manage users and platform settings.

### Operator Dashboard Features:
- **Live Charger Status:** A grid showing all chargers and their real-time state (Available, Charging, Faulted, Offline).
- **Revenue Analytics:** Daily/Weekly charts showing total kWh dispensed and total revenue earned.
- **Active Bookings:** A list of today's upcoming and ongoing bookings.
- **Manual Override:** Buttons to emergency stop a charger or manually mark a slot as out-of-order.
- **Pricing Control:** Ability for the operator to update the per-kWh rate dynamically.
