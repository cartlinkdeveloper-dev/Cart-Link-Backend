const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://cartLink_mongodb:CartLink123@cartlink.edvcqv6.mongodb.net/Cart_Link?retryWrites=true&w=majority&appName=CartLink';

mongoose.set('strictQuery', true);

mongoose.connect(uri, {
    autoIndex: true,
    // Increased timeouts for better connection reliability
    serverSelectionTimeoutMS: 30000,  // Increased to 30 seconds
    connectTimeoutMS: 30000,          // Increased to 30 seconds
    socketTimeoutMS: 45000,           // Socket timeout
})
    .then(() => console.log('✓ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('\n⚠️  Common fixes:');
        console.error('   1. Whitelist your IP in MongoDB Atlas → Network Access');
        console.error('   2. Check your MONGODB_URI in .env file');
        console.error('   3. Verify cluster is not paused in Atlas dashboard\n');
    });

module.exports = mongoose;