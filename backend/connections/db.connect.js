const mongoose = require('mongoose');
const User = require('../models/User');

const ensureUserIndexes = async () => {
    const indexes = await User.collection.indexes();
    const mobileIndex = indexes.find((index) => index.name === 'mobile_1');

    if (mobileIndex && !mobileIndex.partialFilterExpression) {
        await User.collection.dropIndex('mobile_1');
    }

    await User.syncIndexes();
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options help bypass SSL issues in restricted networks
            tls: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 5000, // Don't hang forever
        });
        await ensureUserIndexes();
        console.log(`✅ MongoDB Connected`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log('💡 Tip: If you get "SSL alert number 80", try switching to a Mobile Hotspot or use the Standard connection string (without +srv).');
    }
};

module.exports = connectDB;
