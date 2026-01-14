const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/GestureLink";

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    is_deaf: { type: Boolean, default: true },
    userType: { type: String, default: 'deaf' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const users = [
            {
                username: 'deaf_user',
                email: 'deaf@example.com',
                password: 'password123',
                is_deaf: true,
                userType: 'deaf'
            },
            {
                username: 'hearing_user',
                email: 'hearing@example.com',
                password: 'password123',
                is_deaf: false,
                userType: 'hearing'
            }
        ];

        for (const u of users) {
            const exists = await User.findOne({ username: u.username });
            if (!exists) {
                const hashedPassword = await bcrypt.hash(u.password, 10);
                await User.create({ ...u, password: hashedPassword });
                console.log(`✅ Created user: ${u.username}`);
            } else {
                console.log(`ℹ️ User already exists: ${u.username}`);
            }
        }

        console.log("Seed completed");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

seed();
