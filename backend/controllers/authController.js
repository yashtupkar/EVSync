const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const twilio = require('twilio');


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//generate token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}


exports.googleLogin = async (req, res) => {
    const { credential } = req.body;
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
        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar: avatar || undefined,
                isVerified: true,
                role: "user",
                authProvider: 'google'
            });
            isNewUser = true;
        }
        const token = generateToken(user._id, user.role);
        res.status(200).json({ success: true, token, user, isNewUser });
        console.log("User Logged in via google:", user);
        console.log("Token:", token);

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ success: false, message: 'Invalid Google Token' });

    }
}

exports.sendOTP = async (req, res) => {
    const { mobile } = req.body;
    try {
        const verification = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID).verifications.create({
            to: mobile,
            channel: 'sms'
        });
        res.status(200).json({ success: true, message: 'OTP sent successfully', status: verification.status });
        console.log("OTP sent to:", mobile);
        console.log("Verification Status:", verification.status);

    }
    catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
}

exports.verifyOTP = async (req, res) => {
    const { mobile, otp } = req.body;
    try {
        const verificationChecks = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID).verificationChecks.create({
            to: mobile,
            code: otp
        });

        if (verificationChecks.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        let isNewUser = false;
        let user = await User.findOne({ mobile });
        if (!user) {
            user = await User.create({
                mobile,
                isVerified: true,
                role: "user",
                authProvider: 'phone'
            });
            isNewUser = true;
        }
        const token = generateToken(user._id, user.role);
        res.status(200).json({ success: true, token, user, isNewUser });
        console.log("User Logged in via Phone:", user);
        console.log("Token:", token);

    } catch (error) {
        console.error('Error verifying OTP:', error);
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


