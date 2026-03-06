const mongoose = require('mongoose');
const db = require('../src/config/db');

async function migrateReviewSchema() {
  try {
    // Connect to the database
    await db.connect();
    console.log('✓ Connected to MongoDB');

    const collection = mongoose.connection.collection('reviews');

    // Add orderId field to existing documents if they don't have it
    const updateResult = await collection.updateMany(
      { orderId: { $exists: false } },
      { $set: { orderId: null } }
    );

    console.log(`✓ Updated ${updateResult.modifiedCount} existing review documents`);

    // Create an index on orderId for faster queries
    await collection.createIndex({ orderId: 1 });
    console.log('✓ Created index on orderId field');

    // Create composite index for product and order
    await collection.createIndex({ productId: 1, orderId: 1 });
    console.log('✓ Created composite index on productId and orderId');

    console.log('✓ Review schema migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateReviewSchema();
