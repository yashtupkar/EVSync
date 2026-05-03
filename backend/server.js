process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config();

// Import Routes
const stationRoutes = require('./routes/stationRoutes');
const connectDB = require('./connections/db.connect');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const stationOwnerRoutes = require('./routes/stationOwner.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

connectDB(); // Enabled as requested

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


// Basic Route
app.get('/', (req, res) => {
  res.send('EV-Locater API is running...');
});



const uploadRoutes = require('./routes/upload.routes');

app.use('/api/stations', stationRoutes);
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/station-owner', stationOwnerRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
