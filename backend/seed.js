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
    name: "Sehore Highway Hub",
    address: "SH 18, Sehore, MP",
    location: { type: "Point", coordinates: [77.0850, 23.1970] },
    images: ["https://images.unsplash.com/photo-1563986768609-322da13575f3"],
    chargers: [{ type: "CCS2", power: 120, status: "available", pricePerHour: 22 }],
    rating: 4.5,
    reviewsCount: 56
  },
  {
    name: "Ashta Midpoint Chargers",
    address: "Indore-Bhopal Rd, Ashta, MP",
    location: { type: "Point", coordinates: [76.7180, 23.0180] },
    images: ["https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b"],
    chargers: [{ type: "Type 2", power: 22, status: "available", pricePerHour: 12 }],
    rating: 4.2,
    reviewsCount: 34
  },
  {
    name: "Dewas Industrial Power",
    address: "Industrial Area, Dewas, MP",
    location: { type: "Point", coordinates: [76.0640, 22.9660] },
    images: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7"],
    chargers: [{ type: "CCS2", power: 150, status: "available", pricePerHour: 30 }],
    rating: 4.7,
    reviewsCount: 89
  },
  {
    name: "Indore Bypass QuickCharge",
    address: "Indore Bypass, MP",
    location: { type: "Point", coordinates: [75.9300, 22.7600] },
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [{ type: "CCS2", power: 60, status: "available", pricePerHour: 20 }],
    rating: 4.4,
    reviewsCount: 112
  },
  {
    name: "Vijay Nagar Indore Station",
    address: "Vijay Nagar, Indore, MP",
    location: { type: "Point", coordinates: [75.8950, 22.7533] },
    images: ["https://images.unsplash.com/photo-1563986768609-322da13575f3"],
    chargers: [{ type: "CCS2", power: 120, status: "available", pricePerHour: 25 }],
    rating: 4.9,
    reviewsCount: 230
  }
];
const stations = [
  {
    _id: "bpl1",
    name: "Tata Power - Taj Lakefront",
    address: "Bhadbhada Road, Main Rd No. 3, Nehru Nagar, Bhopal",
    location: { type: "Point", coordinates: [77.3834, 23.2159] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [
      { type: "CCS2", power: 50, status: "available", pricePerHour: 20 },
      { type: "CHAdeMO", power: 50, status: "available", pricePerHour: 20 },
      { type: "Type2", power: 22, status: "available", pricePerHour: 12 },
      { type: "Type2", power: 22, status: "occupied", pricePerHour: 12 }
    ],
    rating: 4.3
  },
  {
    _id: "bpl2",
    name: "Tata Power - Arera Hills",
    address: "53 Hoshangabad Road, Arera Hills, Bhopal",
    location: { type: "Point", coordinates: [77.4316, 23.2399] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64"],
    chargers: [
      { type: "CCS2", power: 60, status: "available", pricePerHour: 22 },
      { type: "Type2", power: 22, status: "occupied", pricePerHour: 12 }
    ],
    rating: 4.1
  },
  {
    _id: "bpl3",
    name: "Tata Power - Varenyam Motors",
    address: "No 56/57, JK Road, Govindpura Industrial Area, Bhopal",
    location: { type: "Point", coordinates: [77.4571, 23.2594] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [
      { type: "CCS2", power: 50, status: "available", pricePerHour: 20 },
      { type: "Type2", power: 22, status: "available", pricePerHour: 12 }
    ],
    rating: 4.0
  },
  {
    _id: "bpl4",
    name: "Tata Power - COCO Extoll College",
    address: "80/2/1/1/2, Rohit Nagar, Gulmohar Colony, Bawadiya Kalan, Bhopal",
    location: { type: "Point", coordinates: [77.4343, 23.1806] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1609429019995-8c40f49535a5"],
    chargers: [
      { type: "CCS2", power: 25, status: "available", pricePerHour: 18 }
    ],
    rating: 3.8
  },
  {
    _id: "bpl5",
    name: "MG - Hriday Cars Charging Station",
    address: "Near Shiv Mandir, Ahmedpur Kalan, Hoshangabad Road, Bhopal",
    location: { type: "Point", coordinates: [77.4516, 23.1888] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1571992803726-be4fc68c5e05"],
    chargers: [
      { type: "CCS2", power: 50, status: "available", pricePerHour: 21 },
      { type: "Type2", power: 7, status: "available", pricePerHour: 10 }
    ],
    rating: 4.2
  },
  {
    _id: "bpl6",
    name: "VEVC - Rani Kamlapati Railway Station",
    address: "Rani Kamlapati Railway Station, Habib Ganj, Bhopal - 462016",
    location: { type: "Point", coordinates: [77.4392, 23.2218] }, // ✅ verified accurate
    images: ["https://images.unsplash.com/photo-1601238518-5e3be7e63e35"],
    chargers: [
      { type: "CCS2", power: 30, status: "available", pricePerHour: 18 },
      { type: "CHAdeMO", power: 30, status: "occupied", pricePerHour: 18 }
    ],
    rating: 4.4
  },
  {
    _id: "bpl7",
    name: "IOCL - Sunder Devi Charging Station",
    address: "S No 179/B1/C1, Jinsi Road, Barkhedi, Bhopal",
    location: { type: "Point", coordinates: [77.4212, 23.2475] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1620714223084-8fcacc2dfd4d"],
    chargers: [
      { type: "CCS2", power: 30, status: "available", pricePerHour: 16 },
      { type: "CHAdeMO", power: 30, status: "available", pricePerHour: 16 }
    ],
    rating: 3.7
  },
  {
    _id: "bpl8",
    name: "Huzur Audi Service Charging Station",
    address: "NH-12, Near Scope University, Misrod, Bhopal",
    location: { type: "Point", coordinates: [77.4792, 23.1537] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7"],
    chargers: [
      { type: "Type2", power: 22, status: "available", pricePerHour: 14 }
    ],
    rating: 4.5
  },
  {
    _id: "bpl9",
    name: "Mahindra - First Choice Win Win Automobiles",
    address: "NH-12, Hoshangabad Road, Misrod, Bhopal",
    location: { type: "Point", coordinates: [77.4793, 23.1478] }, // ✅ corrected
    images: ["https://images.unsplash.com/photo-1609429019995-8c40f49535a5"],
    chargers: [
      { type: "CCS2", power: 50, status: "available", pricePerHour: 20 },
      { type: "Type2", power: 7, status: "occupied", pricePerHour: 10 }
    ],
    rating: 4.1
  }
];

const seedDB = async () => {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB for seeding...");
    
    await Station.deleteMany({});
    console.log("Cleared existing stations.");
    
    const allStations = [
      ...dummyStations,
      ...stations.map(s => {
        const { _id, ...rest } = s; 
        return {
          ...rest,
          chargers: rest.chargers.map(c => ({
            ...c,
            status: c.status === "occupied" ? "in_use" : c.status // Fix enum value
          }))
        };
      })
    ];

    await Station.insertMany(allStations);
    console.log("All stations seeded successfully!");
    
    process.exit();
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
