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
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  
  bookingStatus: { 
    type: String, 
    enum: ['upcoming', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  
  otp: { type: String, required: true }, // 4-digit code
  
  transactionId: { type: String },
  
  vehicleDetails: {
    name: { type: String },
    image: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
