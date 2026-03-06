const mongoose = require('../config/database');
const Shop = require('../models/Shop');

async function run() {
    try {
        const res = await Shop.updateMany(
            { $or: [{ isActive: { $exists: false } }, { isActive: false }] },
            { $set: { isActive: true, updatedAt: new Date() } }
        );
        console.log('Updated documents:', res.modifiedCount ?? res.nModified ?? res);
    } catch (e) {
        console.error('Migration error:', e);
    } finally {
        process.exit(0);
    }
}

run();