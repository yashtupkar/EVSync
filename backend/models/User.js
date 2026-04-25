const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin', 'station_owner'], default: 'user' },
  vehicles: [{
    make: String,
    model: String,
    connectorType: String,
    batteryCapacity: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
