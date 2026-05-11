const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const existingAdmin = await User.findOne({ email: 'admin@evsync.com' });
        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            name: 'System Admin',
            email: 'admin@evsync.com',
            password: hashedPassword,
            role: 'admin',
            status: 'approved'
        });

        await admin.save();
        console.log("Admin created: admin@evsync.com / admin123");
        process.exit();
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

createAdmin();
