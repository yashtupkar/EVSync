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
    _id: "sh1",
    name: "Sehore Highway Hub",
    address: "SH 18, Sehore, MP",
    location: { type: "Point", coordinates: [77.0850, 23.1970] },
    images: ["https://images.unsplash.com/photo-1563986768609-322da13575f3"],
    chargers: [{ type: "CCS2", power: 120, status: "available", pricePerHour: 22 }],
    rating: 4.5
  },
  {
    _id: "as1",
    name: "Ashta Midpoint Chargers",
    address: "Indore-Bhopal Rd, Ashta, MP",
    location: { type: "Point", coordinates: [76.7180, 23.0180] },
    images: ["https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b"],
    chargers: [{ type: "Type 2", power: 22, status: "available", pricePerHour: 12 }],
    rating: 4.2
  },
  {
    _id: "dw1",
    name: "Dewas Industrial Power",
    address: "Industrial Area, Dewas, MP",
    location: { type: "Point", coordinates: [76.0640, 22.9660] },
    images: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7"],
    chargers: [{ type: "CCS2", power: 150, status: "available", pricePerHour: 30 }],
    rating: 4.7
  },
  {
    _id: "ib1",
    name: "Indore Bypass QuickCharge",
    address: "Indore Bypass, MP",
    location: { type: "Point", coordinates: [75.9300, 22.7600] },
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [{ type: "CCS2", power: 60, status: "available", pricePerHour: 20 }],
    rating: 4.4
  },
  {
    _id: "in1",
    name: "Vijay Nagar Indore Station",
    address: "Vijay Nagar, Indore, MP",
    location: { type: "Point", coordinates: [75.8950, 22.7533] },
    images: ["https://images.unsplash.com/photo-1563986768609-322da13575f3"],
    chargers: [{ type: "CCS2", power: 120, status: "available", pricePerHour: 25 }],
    rating: 4.9
  }
];

// Update BH3 to be "Full" for UI test
mockStations[2].chargers[0].status = 'in_use'; 

let mockUsers = [
  { _id: "u1", name: "Yash Tupkar", mobile: "9999999999", role: "admin" }
];
// ---------------------------

const useMock = false; 

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
