// Run this script from the project root with: node backend/scripts/migrate_inStock.js
// It will set `inStock` based on numeric `stock` where missing.

const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cart_link';

async function run() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const coll = db.collection('products');

    console.log('Setting inStock=true where stock > 0');
    const r1 = await coll.updateMany({ stock: { $gt: 0 }, inStock: { $exists: false } }, { $set: { inStock: true } });
    console.log('Matched:', r1.matchedCount, 'Modified:', r1.modifiedCount);

    console.log('Setting inStock=false where stock == 0 and inStock missing');
    const r2 = await coll.updateMany({ $and: [ { $or: [ { stock: 0 }, { stock: { $exists: false } } ] }, { inStock: { $exists: false } } ] }, { $set: { inStock: false } });
    console.log('Matched:', r2.matchedCount, 'Modified:', r2.modifiedCount);

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
