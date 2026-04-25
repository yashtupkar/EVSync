const Station = require('../models/Station');
const User = require('../models/User');

// --- HACKATHON MOCK DATA (BHOPAL LOCATIONS) ---
let mockStations = [
  {
    _id: "bh1",
    name: "New Market EcoCharge",
    address: "GTB Complex, New Market, Bhopal",
    location: { type: "Point", coordinates: [77.3986, 23.2323] },
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [{ type: "CCS2", power: 60, status: "available", pricePerHour: 18 }],
    rating: 4.6
  },
  {
    _id: "bh2",
    name: "Nehru Nagar Volt Station",
    address: "Nehru Nagar Main Rd, Bhopal",
    location: { type: "Point", coordinates: [77.3916, 23.2162] },
    images: ["https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b"],
    chargers: [{ type: "Type 2", power: 22, status: "available", pricePerHour: 12 }],
    rating: 4.3
  },
  {
    _id: "bh3",
    name: "Bhopal Junction FastCharge",
    address: "Station Road, Bhopal Junction",
    location: { type: "Point", coordinates: [77.4102, 23.2721] },
    images: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7"],
    chargers: [{ type: "CCS2", power: 150, status: "in_use", pricePerHour: 35 }],
    rating: 4.8
  },
  {
    _id: "bh4",
    name: "Bhadbhada Dam Charging",
    address: "Bhadbhada Dam Road, Bhopal",
    location: { type: "Point", coordinates: [77.3506, 23.2120] },
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [{ type: "CCS2", power: 30, status: "available", pricePerHour: 15 }],
    rating: 4.1
  }
];

// Update BH3 to be "Full" for UI test
mockStations[2].chargers[0].status = 'in_use'; 

let mockUsers = [
  { _id: "u1", name: "Yash Tupkar", mobile: "9999999999", role: "admin" }
];
// ---------------------------

const useMock = true; 

exports.getAllStations = async (req, res) => {
  try {
    if (useMock) return res.json(mockStations);
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

exports.getNearbyStations = async (req, res) => {
  const { lng, lat } = req.query;
  try {
    if (useMock && lat && lng) {
        const filtered = mockStations.filter(s => {
            const dist = calculateDistance(parseFloat(lat), parseFloat(lng), s.location.coordinates[1], s.location.coordinates[0]);
            return dist <= 20; // 20 km radius
        });
        return res.json(filtered);
    }
    if (useMock) return res.json(mockStations);

    const stations = await Station.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 20000 
        }
      }
    });
    res.json(stations);
  } catch (error) {
    res.json(mockStations);
  }
};

exports.createStation = async (req, res) => {
  try {
    const newMock = { 
        _id: "mock_" + Date.now(), 
        ...req.body,
        location: req.body.location || { type: "Point", coordinates: [77.3986, 23.2323] }
    };
    mockStations.push(newMock);
    res.status(201).json(newMock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    return res.json(mockUsers);
  } catch (error) {
    res.json(mockUsers);
  }
};
