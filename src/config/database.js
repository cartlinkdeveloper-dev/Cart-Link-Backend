const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI ||  'mongodb://cartLink_mongodb:CartLink123@ac-2xfhn13-shard-00-00.edvcqv6.mongodb.net:27017,ac-2xfhn13-shard-00-01.edvcqv6.mongodb.net:27017,ac-2xfhn13-shard-00-02.edvcqv6.mongodb.net:27017/Cart_Link?ssl=true&authSource=admin&appName=Cart_Link'

mongoose.set('strictQuery', true);

mongoose.connect(uri, {
    autoIndex: true,
    // fail-fast timeouts to surface network/DNS issues quickly during development
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
})
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        console.error('MongoDB connection failed — not exiting. Verify Atlas IP whitelist and credentials.');
    });

module.exports = mongoose;