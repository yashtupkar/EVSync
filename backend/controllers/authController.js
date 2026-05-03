const User = require('../models/User');
const Station = require('../models/Station');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const twilio = require('twilio');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const getDuplicateFieldMessage = (error) => {
    if (error?.code !== 11000) {
        return null;
    }

    const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];

    if (duplicateField === 'mobile') {
        return 'Mobile number already exists';
    }

    if (duplicateField === 'email') {
        return 'Email already exists';
    }

    return 'User already exists';
};

// Generate Token with Role and Status
const generateToken = (id, role, status) => {
    return jwt.sign({ id, role, status }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

exports.googleLogin = async (req, res) => {
    const { credential, requestedRole = 'user' } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId, picture: avatar } = payload;

        if (!email) {
            return res.status(400).json({ error: 'Google profile must have email' });
        }

        let isNewUser = false;
        let user = await User.findOne({ email });

        if (user && user.role !== requestedRole) {
            return res.status(403).json({ 
                success: false, 
                message: `Access Denied: Your account is registered as a ${user.role.replace('_', ' ')}. Please login with the correct role.` 
            });
        }

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar: avatar || undefined,
                role: requestedRole,
                status: requestedRole === 'user' ? 'approved' : 'pending',
                authProvider: 'google'
            });
            isNewUser = true;
        }

        const hasStation = await Station.exists({ ownerId: user._id });
        const token = generateToken(user._id, user.role, user.status);
        res.status(200).json({ success: true, token, user: { ...user.toObject(), hasStation: !!hasStation }, isNewUser });
    } catch (error) {
        console.error('Google Auth Error:', error);
        const duplicateMessage = getDuplicateFieldMessage(error);
        if (duplicateMessage) {
            return res.status(409).json({ success: false, message: duplicateMessage });
        }
        res.status(401).json({ success: false, message: 'Invalid Google Token' });
    }
}

exports.sendOTP = async (req, res) => {
    const { mobile } = req.body;
    try {
        // SIMULATION MODE: Always return success for hackathon/dev
        if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID) {
            console.log("SIMULATED OTP sent to:", mobile);
            return res.status(200).json({ success: true, message: 'OTP sent successfully (Simulated)', status: 'pending' });
        }

        const verification = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID).verifications.create({
            to: mobile,
            channel: 'sms'
        });
        res.status(200).json({ success: true, message: 'OTP sent successfully', status: verification.status });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
}

exports.verifyOTP = async (req, res) => {
    const { mobile, otp, requestedRole = 'user' } = req.body;
    try {
        // SIMULATION MODE: Any 6-digit OTP starting with 123 is valid
        const isSimulated = process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID;

        if (isSimulated) {
            if (otp !== '123456' && !otp.startsWith('123')) {
                return res.status(400).json({ success: false, message: 'Invalid OTP (Simulation: Use 123456)' });
            }
        } else {
            const verificationChecks = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID).verificationChecks.create({
                to: mobile,
                code: otp
            });

            if (verificationChecks.status !== 'approved') {
                return res.status(400).json({ success: false, message: 'Invalid OTP' });
            }
        }

        let isNewUser = false;
        let user = await User.findOne({ mobile });

        if (user && user.role !== requestedRole) {
            return res.status(403).json({ 
                success: false, 
                message: `Access Denied: Your account is registered as a ${user.role.replace('_', ' ')}. Please login with the correct role.` 
            });
        }

        if (!user) {
            user = await User.create({
                mobile,
                role: requestedRole,
                status: requestedRole === 'user' ? 'approved' : 'pending',
                authProvider: 'phone'
            });
            isNewUser = true;
        }

        const hasStation = await Station.exists({ ownerId: user._id });
        const token = generateToken(user._id, user.role, user.status);
        res.status(200).json({ success: true, token, user: { ...user.toObject(), hasStation: !!hasStation }, isNewUser });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        const duplicateMessage = getDuplicateFieldMessage(error);
        if (duplicateMessage) {
            return res.status(409).json({ success: false, message: duplicateMessage });
        }
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
}

exports.verifyOnly = async (req, res) => {
        const { mobile, otp } = req.body;
    try {
        const verificationChecks = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID).verificationChecks.create({
            to: mobile,
            code: otp
        });

        if (verificationChecks.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        res.status(200).json({ success: true, message: 'Mobile verified' });
    } catch (error) {
        console.error('Error verifying OTP (Verify Only):', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
}


