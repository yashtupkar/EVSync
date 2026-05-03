const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  avatar: { type: String }, // Optional avatar URL
  dateOfBirth: { type: Date, default: undefined },
  gender: { type: String, default: undefined },
  email: { type: String, default: undefined },
  googleId: { type: String, default: undefined },
  mobile: { type: String, default: undefined },
  
  // NEW FIELDS FOR ONBOARDING
  role: { 
    type: String, 
    enum: ['user', 'admin', 'station_owner', 'operator'], 
    default: 'user' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved' // Regular users are approved by default
  },
  authProvider: { 
    type: String, 
    enum: ['google', 'phone', 'none'], 
    default: 'none' 
  },
  managedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // For operators to track their owner

  vehicles: [{
    vehicleId: { type: String, required: true },
    nickname: { type: String }
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


