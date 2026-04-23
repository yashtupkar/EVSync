# Database Schema (MongoDB + Mongoose)

## User

- \_id
- name
- mobile (unique)
- vehicles: [Vehicle._id]
- role: 'user' | 'admin' | 'station_owner'
- createdAt, updatedAt

## Vehicle

- \_id
- userId (ref User)
- type: '2W' | '3W' | '4W'
- make, model
- batteryCapacity (kWh)
- connectorTypes: [String]
- createdAt, updatedAt

## Station

- \_id
- name
- location: { type: 'Point', coordinates: [lng, lat] } // 2dsphere
- address
- chargers: [Charger._id]
- ownerId (ref User)
- createdAt, updatedAt

## Charger

- \_id
- stationId (ref Station)
- power (kW)
- connectorType
- status: 'available' | 'reserved' | 'in_use'
- currentBooking: Booking.\_id (nullable)
- compatibleVehicles: ['2W', '3W', '4W']
- createdAt, updatedAt

## Booking

- \_id
- userId (ref User)
- vehicleId (ref Vehicle)
- chargerId (ref Charger)
- stationId (ref Station)
- startTime, endTime
- status: 'active' | 'cancelled' | 'completed' | 'no_show'
- cost
- paymentId (ref Payment)
- createdAt, updatedAt

## Payment (Optional)

- \_id
- userId
- bookingId
- amount
- status: 'pending' | 'paid' | 'refunded' | 'failed'
- provider: 'razorpay' | 'stripe'
- transactionId
- createdAt, updatedAt

## OTP Store

- \_id
- mobile
- otp
- expiresAt
- attempts
- verified: Boolean
- createdAt, updatedAt
