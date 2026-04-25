const mongoose = require('mongoose');
const Station = require('./models/Station');
const dotenv = require('dotenv');

dotenv.config();

const dummyStations = [
  {
    name: "New Market EcoCharge",
    address: "GTB Complex, New Market, Bhopal",
    location: { type: "Point", coordinates: [77.3986, 23.2323] },
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [{ type: "CCS2", power: 60, status: "available", pricePerHour: 18 }],
    rating: 4.6,
    reviewsCount: 120
  },
  {
    name: "Nehru Nagar Volt Station",
    address: "Nehru Nagar Main Rd, Bhopal",
    location: { type: "Point", coordinates: [77.3916, 23.2162] },
    images: ["https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b"],
    chargers: [{ type: "Type 2", power: 22, status: "available", pricePerHour: 12 }],
    rating: 4.3,
    reviewsCount: 85
  },
  {
    name: "Bhopal Junction FastCharge",
    address: "Station Road, Bhopal Junction",
    location: { type: "Point", coordinates: [77.4102, 23.2721] },
    images: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7"],
    chargers: [{ type: "CCS2", power: 150, status: "in_use", pricePerHour: 35 }],
    rating: 4.8,
    reviewsCount: 450
  },
  {
    name: "Bhadbhada Dam Charging",
    address: "Bhadbhada Dam Road, Bhopal",
    location: { type: "Point", coordinates: [77.3506, 23.2120] },
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [{ type: "CCS2", power: 30, status: "available", pricePerHour: 15 }],
    rating: 4.1,
    reviewsCount: 45
  }
];

const seedDB = async () => {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for seeding...");
    
    await Station.deleteMany({});
    console.log("Cleared existing stations.");
    
    await Station.insertMany(dummyStations);
    console.log("Bhopal stations seeded successfully!");
    
    process.exit();
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
