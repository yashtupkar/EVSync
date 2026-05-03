const Station = require('../models/Station');
const User = require('../models/User');

/**
 * Request to add a new station
 */
exports.addStationRequest = async (req, res) => {
    try {
        const {
            name,
            description,
            address,
            location,
            chargerDetails,
            pricing,
            amenities,
            stationType,
            images,
            contactNumber,
            operatingHours,
            email,
            gstNo,
            operatorName
        } = req.body;

        const newStation = new Station({
            ownerId: req.user.id,
            name,
            description,
            address,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            },
            chargerDetails,
            // Map chargers array if provided in that format
            chargers: req.body.chargers || [],
            pricing,
            amenities,
            stationType,
            images: images || [],
            contactNumber,
            operatingHours,
            email,
            gstNo,
            operatorName,
            status: 'pending'
        });

        await newStation.save();
        res.status(201).json({ success: true, station: newStation });
    } catch (error) {
        console.error('Error adding station request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all stations owned by the current user
 */
exports.getMyStations = async (req, res) => {
    try {
        const stations = await Station.find({ ownerId: req.user.id }).populate('operatorIds', 'name mobile');
        res.status(200).json({ success: true, stations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Assign an operator to a manned station
 */
exports.assignOperator = async (req, res) => {
    const { stationId, operatorEmail, operatorName } = req.body;
    try {
        const station = await Station.findById(stationId);
        
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        // Authorization check: Admin can manage any station, Owners only their own
        const isOwner = station.ownerId.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not have permission to manage this station' });
        }

        if (station.stationType !== 'manned') {
            return res.status(400).json({ success: false, message: 'Only manned stations can have operators' });
        }

        // Find or create operator user by email
        let operator = await User.findOne({ email: operatorEmail });
        
        // The operator should always be managed by the station owner
        const managerId = station.ownerId;

        if (!operator) {
            operator = await User.create({
                name: operatorName,
                email: operatorEmail,
                role: 'operator',
                status: 'approved',
                managedBy: managerId
            });
        } else {
            operator.role = 'operator';
            operator.managedBy = managerId;
            await operator.save();
        }

        station.operatorIds = station.operatorIds || [];
        if (!station.operatorIds.includes(operator._id)) {
            station.operatorIds.push(operator._id);
            await station.save();
        }

        res.status(200).json({ success: true, message: 'Operator assigned successfully', operator });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

