const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const mqttService = require('../services/mqttService');


const { sendBookingConfirmation } = require('../services/smsService');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


/**
 * Get available slots and booked ranges for a charger on a specific date
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { stationId, chargerId, date } = req.query;

    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const charger = station.chargers.find(c => c.chargerId === chargerId);
    if (!charger) return res.status(404).json({ message: 'Charger not found' });

    // Find existing active or upcoming bookings for this charger on this date
    // Ignore cancelled, completed, and stale pending_payment bookings (> 10 mins)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingBookings = await Booking.find({
      stationId,
      chargerId,
      date,
      $or: [
        { bookingStatus: { $in: ['upcoming', 'charging', 'billing_pending'] } },
        { bookingStatus: 'pending_payment', createdAt: { $gt: tenMinsAgo } }
      ]
    });

    const bookedRanges = existingBookings.map(b => ({
      start: b.startTime,
      end: b.endTime
    }));

    res.status(200).json({
      operatingHours: station.operatingHours,
      bookedRanges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const timeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
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
      startTime,
      endTime,
      amount,
      vehicleDetails,
      isInstant
    } = req.body;

    const userId = req.user.id; // From authMiddleware
    const user = await User.findById(userId);

    // Check if user is banned
    if (user && user.isBanned) {
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: 'Your account has been banned due to excessive cancellations. Please contact support.'
      });
    }

    // Check for overlaps with existing active or upcoming bookings
    // Ignore cancelled, completed, and stale pending_payment bookings (> 10 mins)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingBookings = await Booking.find({
      stationId,
      chargerId,
      date,
      $or: [
        { bookingStatus: { $in: ['upcoming', 'charging', 'billing_pending'] } },
        { bookingStatus: 'pending_payment', createdAt: { $gt: tenMinsAgo } }
      ]
    });

    for (const booking of existingBookings) {
      if (isOverlapping(startTime, endTime, booking.startTime, booking.endTime)) {
        return res.status(400).json({
          message: `This time range overlaps with an existing booking (${booking.startTime} - ${booking.endTime}).`,
          overlap: {
            start: booking.startTime,
            end: booking.endTime,
            status: booking.bookingStatus
          }
        });
      }
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
      isInstant,
      paymentStatus: 'pending'
    });

    await newBooking.save();

    // Create Razorpay Order
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
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

    const io = req.app.get('socketio');

    // Only update charger status to 'occupied' immediately for INSTANT bookings
    // Future bookings will remain 'available' until the scheduled time or manual start
    if (booking.isInstant) {
      const newStatus = 'occupied';
      await Station.findOneAndUpdate(
        { _id: booking.stationId._id, "chargers.chargerId": booking.chargerId },
        { $set: { "chargers.$.status": newStatus } }
      );

      if (io) {
        io.emit('charger_status_updated', {
          stationId: booking.stationId._id,
          chargerId: booking.chargerId,
          status: newStatus
        });
      }
    }


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

    if (io) {
      io.emit('booking_confirmed', {
        stationId: booking.stationId._id.toString(),
        bookingId: booking._id.toString(),
        userId: booking.userId._id.toString(),
        chargerId: booking.chargerId,
        date: booking.date,
        timeSlot: `${booking.startTime} - ${booking.endTime}`
      });

      // Notify the station owner/host specifically
      if (booking.stationId.ownerId) {
        io.to(booking.stationId.ownerId.toString()).emit('new_booking_notification', {
          bookingId: booking._id.toString(),
          stationName: booking.stationId.name,
          userName: booking.userId.name,
          timeSlot: `${booking.startTime} - ${booking.endTime}`,
          amount: booking.amount
        });
      }
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

    // If bill is pending, include order info
    let billOrder = null;
    if (booking.bookingStatus === 'billing_pending' && booking.billPaymentStatus === 'unpaid' && booking.billOrderId) {
      billOrder = {
        id: booking.billOrderId,
        amount: Math.round(booking.totalBill * 100),
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID
      };
    }

    res.status(200).json({ success: true, booking, billOrder });
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

    const previousStatus = booking.bookingStatus;
    booking.bookingStatus = status;
    await booking.save();

    // Automated Banning Logic: Check total cancellations
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      const totalCancellations = await Booking.countDocuments({ 
        userId: booking.userId, 
        bookingStatus: 'cancelled' 
      });

      if (totalCancellations > 5) {
        await User.findByIdAndUpdate(booking.userId, {
          isBanned: true,
          banReason: `Automatic ban: Total cancellations (${totalCancellations}) exceeded the limit of 5.`
        });
      }
      
      // Update counter for UI
      await User.findByIdAndUpdate(booking.userId, { cancellationCount: totalCancellations });
    }

    if (status === 'completed' && previousStatus !== 'completed') {
      await User.findByIdAndUpdate(booking.userId, { $inc: { credits: 10 } });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_status_updated', {
        bookingId: booking._id.toString(),
        stationId: booking.stationId.toString(),
        status: status,
        userId: booking.userId.toString()
      });
      
      // Notify user about credits if completed
      if (status === 'completed' && previousStatus !== 'completed') {
        io.to(booking.userId.toString()).emit('credits_updated', {
          creditsEarned: 10,
          message: 'You earned 10 credits for completing your session!'
        });
      }
    }

    res.status(200).json({ success: true, message: `Booking marked as ${status}`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start charging session (Manual)
 */
exports.startCharging = async (req, res) => {
  const { bookingId } = req.params;
  const { otp, useMqtt } = req.body;
  const io = req.app.get('socketio');

  try {
    const booking = await Booking.findById(bookingId).populate('stationId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (['completed', 'billing_pending'].includes(booking.bookingStatus)) {
      return res.status(400).json({ success: false, message: 'Charging already handled' });
    }

    // Verify OTP
    if (!otp || booking.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP provided' });
    }

    booking.bookingStatus = 'charging';
    booking.percentage = 0;
    booking.currentKwh = 0;
    booking.statusMessage = 'Charging in progress...';
    
    // Set a transaction ID for MQTT matching
    booking.transactionId = `TXN_${booking._id.toString().slice(-6)}`;
    
    await booking.save();

    // Update station charger status to in_use
    await Station.findOneAndUpdate(
      { _id: booking.stationId._id, "chargers.chargerId": booking.chargerId },
      { $set: { "chargers.$.status": 'in_use' } }
    );

    // Trigger MQTT Start only if requested
    if (useMqtt) {
      try {
        await mqttService.startCharging(booking._id, {
          currentPercent: 20,
          targetPercent: 90
        });
      } catch (mqttErr) {
        console.error("MQTT Start Error:", mqttErr);
      }
    }

    // Emit initial status
    if (io) {
      io.emit('charging_update', {
        bookingId: bookingId.toString(),
        percentage: 0,
        currentKwh: 0,
        status: 'charging'
      });
      io.emit('booking_status_updated', {
        bookingId: bookingId.toString(),
        stationId: booking.stationId._id.toString(),
        status: 'charging'
      });
      io.emit('charger_status_updated', {
        stationId: booking.stationId._id.toString(),
        chargerId: booking.chargerId,
        status: 'in_use'
      });
    }

    res.status(200).json({ success: true, message: 'Charging session started' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start charging session (MQTT Unmanned)
 */
exports.startMqttCharging = async (req, res) => {
  const { bookingId } = req.params;
  const { currentPercent, targetPercent } = req.body;
  const io = req.app.get('socketio');

  try {
    const booking = await Booking.findById(bookingId).populate('stationId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Update status
    booking.bookingStatus = 'charging';
    booking.percentage = currentPercent || 0;
    booking.targetPercentage = targetPercent || 80;
    booking.currentKwh = 0;

    booking.statusMessage = 'Charging started remotely...';

    // Set a transaction ID for MQTT matching if not already set
    if (!booking.transactionId) {
      booking.transactionId = `TXN_${booking._id.toString().slice(-6)}`;
    }

    await booking.save();

    // Update station charger status
    await Station.findOneAndUpdate(
      { _id: booking.stationId._id, "chargers.chargerId": booking.chargerId },
      { $set: { "chargers.$.status": 'in_use' } }
    );

    // Send MQTT command
    mqttService.startCharging(booking._id, {
      batteryCapacity: 40, // Default or from vehicle
      currentPercent: currentPercent,
      targetPercent: targetPercent
    });


    if (io) {
      io.emit('charging_update', {
        bookingId: bookingId.toString(),
        percentage: currentPercent,
        currentKwh: 0,
        status: 'charging'
      });
      io.emit('booking_status_updated', {
        bookingId: bookingId.toString(),
        stationId: booking.stationId._id.toString(),
        status: 'charging'
      });
    }

    res.status(200).json({ success: true, message: 'Charging command sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Stop charging session (By Operator)
 */
exports.stopCharging = async (req, res) => {
  const { bookingId } = req.params;
  const io = req.app.get('socketio');

  try {
    const booking = await Booking.findById(bookingId).populate('stationId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.bookingStatus = 'billing_pending';
    booking.statusMessage = 'Charging stopped. Waiting for billing...';
    await booking.save();

    if (io) {
      io.emit('charging_update', {
        bookingId: bookingId.toString(),
        status: 'billing_pending'
      });
      io.emit('booking_status_updated', {
        bookingId: bookingId.toString(),
        stationId: booking.stationId._id.toString(),
        status: 'billing_pending'
      });
      // Charger becomes available once charging stops
      io.emit('charger_status_updated', {
        stationId: booking.stationId._id.toString(),
        chargerId: booking.chargerId,
        status: 'available'
      });
    }

    // Send MQTT Stop
    mqttService.stopCharging(bookingId);

    res.status(200).json({ success: true, message: 'Charging session stopped' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate bill after charging stops
 */
exports.generateBill = async (req, res) => {
  const { bookingId } = req.params;
  const { unitsConsumed } = req.body;
  const io = req.app.get('socketio');

  try {
    const booking = await Booking.findById(bookingId).populate('stationId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Find the charger to get price
    const charger = booking.stationId.chargers.find(c => c.chargerId === booking.chargerId);
    const rate = charger?.pricePerUnit || charger?.price || 15;

    const totalAmount = (unitsConsumed * rate).toFixed(2);

    booking.unitsConsumed = unitsConsumed;
    booking.totalBill = totalAmount;
    await booking.save();

    // Create Razorpay Order for the bill
    const options = {
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `bill_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    booking.billOrderId = order.id;
    await booking.save();

    if (io) {
      io.emit('bill_generated', {
        bookingId: bookingId.toString(),
        stationId: booking.stationId._id.toString(),
        unitsConsumed,
        totalBill: totalAmount,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill generated',
      bill: { unitsConsumed, totalBill: totalAmount, order }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm bill payment
 */
exports.confirmBillPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid bill payment signature' });
    }

    const booking = await Booking.findById(bookingId).populate('stationId');
    booking.billPaymentStatus = 'paid';
    booking.billTransactionId = razorpay_payment_id;
    booking.bookingStatus = 'completed';
    booking.statusMessage = 'Charging and payment completed!';
    await booking.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_status_updated', {
        bookingId: bookingId.toString(),
        stationId: booking.stationId._id.toString(),
        status: 'completed'
      });
      io.emit('bill_paid', {
        bookingId: bookingId.toString(),
        stationId: booking.stationId._id.toString()
      });

      // Award credits and notify
      await User.findByIdAndUpdate(booking.userId, { $inc: { credits: 10 } });
      io.to(booking.userId.toString()).emit('credits_updated', {
        creditsEarned: 10,
        message: 'You earned 10 credits for completing your session!'
      });
    }

    res.status(200).json({ success: true, message: 'Bill paid successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get summary stats for a host (home charger owner)
 */
exports.getHostSummary = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const stations = await Station.find({ ownerId });
    const stationIds = stations.map(s => s._id);

    const bookings = await Booking.find({
      stationId: { $in: stationIds },
      paymentStatus: 'paid'
    });

    const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalBill || b.amount), 0);
    const totalBookings = bookings.length;
    const activeSessions = bookings.filter(b => b.bookingStatus === 'charging').length;
    const pendingVerifications = bookings.filter(b => b.bookingStatus === 'upcoming').length;

    res.status(200).json({
      success: true,
      summary: {
        totalEarnings,
        totalBookings,
        activeSessions,
        pendingVerifications
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all bookings for stations owned by the current host
 */
exports.getHostBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const stations = await Station.find({ ownerId });
    const stationIds = stations.map(s => s._id);

    const bookings = await Booking.find({ stationId: { $in: stationIds } })
      .populate('userId', 'name mobile email avatar')
      .populate('stationId', 'name address chargers')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
