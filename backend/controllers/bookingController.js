const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../services/smsService');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// Helper to generate slots
const generateTimeSlots = (operatingHours) => {
  // Simple parser for "09:00 AM - 09:00 PM" or "24 Hours"
  if (!operatingHours || operatingHours.toLowerCase().includes('24 hours')) {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      const nextHour = (i + 1) % 12 || 12;
      const nextAmpm = (i + 1) < 12 || (i + 1) === 24 ? 'AM' : 'PM';
      return `${hour}:00 ${ampm} - ${nextHour}:00 ${nextAmpm}`;
    });
  }

  try {
    const [start, end] = operatingHours.split('-').map(t => t.trim());
    // This is a simplified version. For a real app, use moment or date-fns.
    // For now, let's assume standard format "HH:MM AM - HH:MM PM"
    const parseTime = (t) => {
      const [time, modifier] = t.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours;
    };

    const startHour = parseTime(start);
    const endHour = parseTime(end);
    
    const slots = [];
    for (let h = startHour; h < endHour; h++) {
      const hour = h % 12 || 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const nextH = h + 1;
      const nextHour = nextH % 12 || 12;
      const nextAmpm = nextH < 12 || nextH === 24 ? 'AM' : 'PM';
      slots.push(`${hour}:00 ${ampm} - ${nextHour}:00 ${nextAmpm}`);
    }
    return slots;
  } catch (e) {
    return ["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM"]; // Fallback
  }
};

/**
 * Get available slots for a charger on a specific date
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { stationId, chargerId, date } = req.query;
    
    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const charger = station.chargers.find(c => c.chargerId === chargerId);
    if (!charger) return res.status(404).json({ message: 'Charger not found' });

    const allSlots = generateTimeSlots(station.operatingHours);
    
    // Find existing bookings for this charger on this date
    const existingBookings = await Booking.find({
      stationId,
      chargerId,
      date,
      bookingStatus: { $ne: 'cancelled' }
    });

    const bookedTimes = existingBookings.map(b => `${b.startTime} - ${b.endTime}`);

    const availability = allSlots.map(slot => ({
      time: slot,
      status: bookedTimes.includes(slot) ? 'booked' : 'available'
    }));

    res.status(200).json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new booking (starts as pending)
 */
exports.createBooking = async (req, res) => {
  try {
    const { 
      stationId, 
      chargerId, 
      date, 
      timeSlot, 
      amount,
      vehicleDetails
    } = req.body;

    const userId = req.user.id; // From authMiddleware
    
    // Split "10:00 AM - 11:00 AM"
    const [startTime, endTime] = timeSlot.split('-').map(t => t.trim());

    // Check for double booking (Race condition protection)
    const existing = await Booking.findOne({
      stationId,
      chargerId,
      date,
      startTime,
      bookingStatus: { $ne: 'cancelled' }
    });

    if (existing) {
      return res.status(400).json({ message: 'This slot was just booked by someone else.' });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking = new Booking({
      userId,
      stationId,
      chargerId,
      date,
      startTime,
      endTime,
      amount,
      otp,
      vehicleDetails,
      paymentStatus: 'pending'
    });

    await newBooking.save();

    // Create Razorpay Order
    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${newBooking._id}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      booking: newBooking,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ message: error.message });
  }
};


/**
 * Confirm booking after payment
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { 
      bookingId, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = req.body;

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log('✍️ Signature Check:', {
      received: razorpay_signature,
      expected: expectedSignature,
      secretUsed: process.env.RAZORPAY_KEY_SECRET ? 'YES' : 'NO'
    });

    const isSignatureValid = expectedSignature === razorpay_signature;


    if (!isSignatureValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
    
    const booking = await Booking.findById(bookingId).populate('stationId userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.paymentStatus = 'paid';
    booking.transactionId = razorpay_payment_id;
    booking.bookingStatus = 'upcoming';
    
    await booking.save();


    // Send SMS via Twilio
    if (booking.userId && booking.userId.mobile && booking.stationId) {
      console.log('📱 Attempting to send SMS to:', booking.userId.mobile);
      const smsResult = await sendBookingConfirmation(booking.userId.mobile, {
        stationName: booking.stationId.name || 'EV Station',
        date: booking.date,
        time: `${booking.startTime} - ${booking.endTime}`,
        otp: booking.otp,
        chargerId: booking.chargerId
      });
      console.log('📩 SMS Result:', smsResult);
    } else {
      console.warn('⚠️ Cannot send SMS: Missing user mobile or station info', {
        hasUser: !!booking.userId,
        hasMobile: booking.userId?.mobile,
        hasStation: !!booking.stationId
      });
    }



    res.status(200).json({ 
      message: 'Booking confirmed successfully',
      booking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user's bookings
 */
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('stationId')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get bookings for a specific station (accessible by owner/operator)
 */
exports.getStationBookings = async (req, res) => {
  const { stationId } = req.params;
  try {
    const bookings = await Booking.find({ stationId })
      .populate('userId', 'name mobile email')
      .sort({ date: -1, startTime: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single booking by ID (for verification)
 */
exports.getBookingById = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name mobile email')
      .populate('stationId', 'name address chargers');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update booking status (by operator/admin)
 */
exports.updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.bookingStatus = status;
    await booking.save();

    res.status(200).json({ success: true, message: `Booking marked as ${status}`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
