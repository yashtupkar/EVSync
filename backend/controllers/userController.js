const User = require('../models/User');

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

exports.updateProfile = async (req,res) => {
    const {email, name, gender, dateOfBirth, mobile }= req.body;
    const userId = req.user.id;
    try{
        const user = await User.findById(userId);
        if(!mobile && !email){
            return res.status(400).json({msg: 'Mobile or email is required'})
        }
        if(!user){
            return res.status(404).json({msg: 'User not found'})
        }
        
        if (email !== undefined) user.email = email;
        if (name !== undefined) user.name = name;
        if (gender !== undefined) user.gender = gender;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
        if (mobile !== undefined) user.mobile = mobile;
      
        if (req.file) {
            user.avatar = req.file.path;
        }
        await user.save();
        res.status(200).json({msg: 'Profile updated successfully',user});
     
        
           
    }
    catch(err){
        console.error(err.message);
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];

            if (duplicateField === 'mobile') {
                return res.status(409).json({ msg: 'Mobile number already exists' });
            }

            if (duplicateField === 'email') {
                return res.status(409).json({ msg: 'Email already exists' });
            }

            return res.status(409).json({ msg: 'User already exists' });
        }
        res.status(500).send('Server Error');
    }
}

exports.addVehicle = async (req, res) => {
    const { vehicleId, nickname } = req.body;
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        const vehicleExists = user.vehicles.some(v => v.vehicleId === vehicleId);
        if (vehicleExists) {
            return res.status(400).json({ msg: 'Vehicle already added' });
        }
        
        user.vehicles.push({ vehicleId, nickname });
        await user.save();
        
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

