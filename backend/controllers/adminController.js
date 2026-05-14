const Station = require('../models/Station');
const User = require('../models/User');

/**
 * Get all station requests (pending, approved, rejected)
 */
exports.getAllStationRequests = async (req, res) => {
    try {
        const stations = await Station.find().populate('ownerId', 'name email mobile').sort({ createdAt: -1 });
        res.status(200).json({ success: true, stations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all pending station requests
 */
exports.getPendingStations = async (req, res) => {
    try {
        const stations = await Station.find({ status: 'pending' }).populate('ownerId', 'name email mobile');
        res.status(200).json({ success: true, stations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Approve a station request
 */
exports.approveStation = async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        station.status = 'approved';
        await station.save();

        // If this is the owner's first approved station, approve the owner too
        const owner = await User.findById(station.ownerId);
        if (owner && owner.status !== 'approved') {
            owner.status = 'approved';
            await owner.save();
        }

        res.status(200).json({ success: true, message: 'Station approved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Reject a station request
 */
exports.rejectStation = async (req, res) => {
    const { reason } = req.body;
    try {
        const station = await Station.findById(req.params.id);
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        station.status = 'rejected';
        station.rejectionReason = reason;
        await station.save();

        res.status(200).json({ success: true, message: 'Station rejected successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all users for management
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new station (Admin)
 */
exports.createAdminStation = async (req, res) => {
    try {
        const stationData = req.body;
        
        // If ownerId is not provided, set the admin as the owner
        if (!stationData.ownerId) {
            stationData.ownerId = req.user.id;
        }

        // Transform location {lat, lng} to GeoJSON
        if (stationData.location && stationData.location.lat !== undefined && stationData.location.lng !== undefined) {
            stationData.location = {
                type: 'Point',
                coordinates: [stationData.location.lng, stationData.location.lat]
            };
        }

        const newStation = new Station(stationData);
        await newStation.save();

        res.status(201).json({ success: true, station: newStation, message: 'Station created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update an existing station (Admin)
 */
exports.updateAdminStation = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Transform location {lat, lng} to GeoJSON
        if (updateData.location && updateData.location.lat !== undefined && updateData.location.lng !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: [updateData.location.lng, updateData.location.lat]
            };
        }

        const updatedStation = await Station.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedStation) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        res.status(200).json({ success: true, station: updatedStation, message: 'Station updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a station (Admin)
 */
exports.deleteAdminStation = async (req, res) => {
    try {
        const deletedStation = await Station.findByIdAndDelete(req.params.id);

        if (!deletedStation) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        res.status(200).json({ success: true, message: 'Station deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Toggle a user's ban status (Admin)
 */
exports.toggleUserBan = async (req, res) => {
    const { id } = req.params;
    const { banReason } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isBanned = !user.isBanned;
        if (user.isBanned) {
            user.banReason = banReason || 'Manually banned by administrator.';
        } else {
            user.banReason = undefined;
            user.cancellationCount = 0; // Reset count when unbanning
        }

        await user.save();

        res.status(200).json({ 
            success: true, 
            message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
            user 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

