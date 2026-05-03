const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema({
  chargerId: { type: String, required: true }, // e.g., DC-01, AC-01
  type: { type: String, required: true }, // e.g., CCS2, Type 2, AC, DC
  power: { type: Number, required: true }, // in kW
  status: { type: String, enum: ['available', 'reserved', 'in_use', 'maintenance'], default: 'available' },
  pricePerUnit: { type: Number, default: 0 }, // ₹/kWh
  pricePerMinute: { type: Number, default: 0 }, // ₹/min
  totalSlots: { type: Number, default: 1 }
});

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  images: [String],
  chargers: [chargerSchema],
  
  // NEW FIELDS
  stationType: { type: String, enum: ['manned', 'unmanned'], default: 'unmanned' },
  amenities: [String], // e.g., parking, washroom, cafe
  contactNumber: { type: String },
  email: { type: String },
  gstNo: { type: String },
  operatorName: { type: String },
  operatingHours: { type: String },
  
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  operatorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For manned stations
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: { type: String },
  
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 }
}, { timestamps: true });

stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);
