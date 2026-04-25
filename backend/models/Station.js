const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., CCS2, Type 2
  power: { type: Number, required: true }, // in kW
  status: { type: String, enum: ['available', 'reserved', 'in_use'], default: 'available' },
  pricePerHour: { type: Number, default: 0 }
});

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  images: [String],
  chargers: [chargerSchema],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 }
}, { timestamps: true });

stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);
