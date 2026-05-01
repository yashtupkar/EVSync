const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String,  },
  avatar: { type: String }, // Optional avatar URL
  dateOfBirth: { type: Date, default: undefined }, // Added for Google login
  gender: { type: String, default: undefined }, // Added for Google login
  email: { type: String, default: undefined }, // Added for Google login
  googleId: { type: String, default: undefined }, // Added for Google login
  mobile: { type: String, default: undefined }, // Avoid storing null for Google-only users
  role: { type: String, enum: ['user', 'admin', 'station_owner'], default: 'user' },
  vehicles: [{
    vehicleId: { type: String, required: true }, // Stores the 'id' from ev-data.json (e.g., 'in-car-001')
    nickname: { type: String } // Optional: let the user name their car
  }]
}, { timestamps: true });

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);

userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
);

userSchema.index(
  { mobile: 1 },
  { unique: true, partialFilterExpression: { mobile: { $type: 'string' } } }
);

module.exports = mongoose.model('User', userSchema);


