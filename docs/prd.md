# Product Requirement Document (PRD)

## Problem

- EV users struggle to find available, compatible charging stations in real time.
- Booking is unreliable; double-booking and no-shows waste resources.
- Route planning for long trips is manual and error-prone.
- Station owners lack tools for management, analytics, and revenue tracking.

## Solution

A smart, real-time EV charging locator and booking platform with:

- Map-based discovery (Leaflet + OpenStreetMap)
- Real-time charger status and booking
- Route-based charging suggestions
- OTP/GPS-based charging start (no hardware QR)
- Admin dashboard for station management and analytics

## User Personas

- **EV Owner**: Wants to find, book, and pay for charging easily.
- **Fleet Manager**: Manages multiple vehicles, needs analytics.
- **Station Owner/Admin**: Manages stations, tracks usage and revenue.
- **Traveler**: Plans long trips, needs route-based charging.

## Features

### Must-Have

- Map-based station search (with geo queries)
- Real-time charger status (Socket.io)
- Charger-based booking (not vehicle-based)
- Charging time/cost calculation
- Route-based charging planner
- OTP mobile login
- GPS/OTP-based charging start
- Admin dashboard (station, charger, booking management)
- Payment integration (design)
- Notifications (SMS, reminders)
- Analytics (user/admin)

### Advanced

- Vehicle compatibility filtering
- Auto-release of slots for no-shows
- Refund/cancellation logic
- Role-based admin access
- Usage analytics (peak hours, revenue)

## User Stories

- As a user, I can find nearby compatible stations on a map.
- As a user, I can book a charger for a specific time slot.
- As a user, I can see real-time charger availability.
- As a user, I can plan a trip and get charging stop suggestions.
- As a user, I can start charging using OTP or GPS.
- As an admin, I can add/edit stations and chargers.
- As an admin, I can view analytics and revenue.

## Success Metrics

- Booking success rate
- Charger utilization rate
- User retention
- Admin dashboard usage
- Payment completion rate
