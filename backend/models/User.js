const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String,  },
  avatar: { type: String }, // Optional avatar URL
  email: { type: String, unique: true, sparse: true }, // Added for Google login
  googleId: { type: String, unique: true, sparse: true }, // Added for Google login
  mobile: { type: String, unique: true, sparse: true }, // sparse allows it to be null initially if Google login
  role: { type: String, enum: ['user', 'admin', 'station_owner'], default: 'user' },
  vehicles: [{
    vehicleId: { type: String, required: true }, // Stores the 'id' from ev-data.json (e.g., 'in-car-001')
    nickname: { type: String } // Optional: let the user name their car
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
