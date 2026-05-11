const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  chargerId: { type: String, required: true }, // The ID within the station's chargers array
  
  date: { type: String, required: true }, // Format: "May 6, 2024"
  startTime: { type: String, required: true }, // Format: "10:00 AM"
  endTime: { type: String, required: true }, // Format: "11:00 AM"
  
  amount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  
  bookingStatus: { 
    type: String, 
    enum: ['pending_payment', 'upcoming', 'charging', 'billing_pending', 'completed', 'cancelled'], 
    default: 'pending_payment' 
  },

  unitsConsumed: { type: Number, default: 0 },
  totalBill: { type: Number, default: 0 },
  billPaymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid'], 
    default: 'unpaid' 
  },
  billOrderId: { type: String },
  billTransactionId: { type: String },
  
  currentKwh: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  targetPercentage: { type: Number, default: 80 },
  elapsedTime: { type: String, default: '00:00:00' },
  ratePerKwh: { type: Number, default: 0 },
  statusMessage: { type: String, default: 'Ready to charge' },


  
  otp: { type: String, required: true }, // 4-digit code
  
  transactionId: { type: String },
  
  vehicleDetails: {
    name: { type: String },
    image: { type: String }
  },
  
  isInstant: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
