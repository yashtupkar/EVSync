const cron = require('node-cron');
const Booking = require('../models/Booking');
const Station = require('../models/Station');

const parseBookingTime = (dateStr, timeStr) => {
    return new Date(`${dateStr} ${timeStr}`);
};

const startCronJobs = (io) => {
    // Run every minute (standard production schedule)
    cron.schedule('* * * * *', async () => {
        try {
            // Find bookings that are 'upcoming' (confirmed and paid but not started)
            const upcomingBookings = await Booking.find({ bookingStatus: 'upcoming' });
            const now = new Date();

            for (const booking of upcomingBookings) {
                const bookingStartTime = parseBookingTime(booking.date, booking.startTime);
                
                // If it's time for the booking to start
                if (now >= bookingStartTime) {
                    // Update charger status to 'occupied' if it hasn't been done
                    const station = await Station.findById(booking.stationId);
                    if (station) {
                        const charger = station.chargers.find(c => c.chargerId === booking.chargerId);
                        // Instant bookings might already be 'occupied', but future bookings become 'occupied' at start time
                        if (charger && charger.status !== 'occupied' && charger.status !== 'in_use') {
                            await Station.findOneAndUpdate(
                                { _id: booking.stationId, "chargers.chargerId": booking.chargerId },
                                { $set: { "chargers.$.status": 'occupied' } }
                            );
                            if (io) {
                                io.emit('charger_status_updated', {
                                    stationId: booking.stationId,
                                    chargerId: booking.chargerId,
                                    status: 'occupied'
                                });
                            }
                        }
                    }

                    // we use the actual booking update time (which is when payment succeeded) 
                    // if it's later than the parsed start time. This prevents the payment time from eating into the 2 minutes.
                    const referenceTime = Math.max(bookingStartTime.getTime(), new Date(booking.updatedAt).getTime());
                    
                    // Check if 15 minutes have passed since the reference time
                    const fifteenMinsLater = new Date(referenceTime + 15 * 60000);
                    
                    if (now > fifteenMinsLater) {
                        // Auto-cancel the booking
                        booking.bookingStatus = 'cancelled';
                        booking.paymentStatus = 'refunded'; // Simulate refund
                        booking.statusMessage = 'Auto-cancelled: Did not start within 15 minutes';
                        await booking.save();

                        // Release the charger slot back to 'available'
                        await Station.findOneAndUpdate(
                            { _id: booking.stationId, "chargers.chargerId": booking.chargerId },
                            { $set: { "chargers.$.status": 'available' } }
                        );

                        // Emit events to update real-time UI
                        if (io) {
                            io.emit('booking_status_updated', {
                                bookingId: booking._id.toString(),
                                stationId: booking.stationId.toString(),
                                status: 'cancelled',
                                userId: booking.userId.toString()
                            });
                            io.emit('charger_status_updated', {
                                stationId: booking.stationId.toString(),
                                chargerId: booking.chargerId,
                                status: 'available'
                            });
                        }
                        
                        console.log(`[Cron] Booking ${booking._id} auto-cancelled due to 15-minute timeout.`);
                    }
                }
            }
        } catch (error) {
            console.error("[Cron] Error in booking auto-release job:", error);
        }
    });
    console.log('✅ Cron jobs initialized');
};

module.exports = startCronJobs;
