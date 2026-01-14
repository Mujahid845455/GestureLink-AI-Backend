const mongoose = require('mongoose');
const MONGODB_URI = "mongodb://localhost:27017/GestureLink";

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log("User count:", userCount);

        if (userCount > 0) {
            const users = await mongoose.connection.db.collection('users').find({}, { projection: { password: 0 } }).toArray();
            console.log("Users:", users);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkUsers();
