const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options help bypass SSL issues in restricted networks
            tls: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 5000, // Don't hang forever
        });
        console.log(`✅ MongoDB Connected`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log('💡 Tip: If you get "SSL alert number 80", try switching to a Mobile Hotspot or use the Standard connection string (without +srv).');
    }
};

module.exports = connectDB;
