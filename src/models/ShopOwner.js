const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ShopOwnerSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: false, lowercase: true },
    mobile: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    businessType: { type: String, required: false },
    address: { type: String, required: false },
    taxId: { type: String, required: false },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    balance: { type: Number, default: 0 },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, required: false },
    otpExpiry: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now }

}
    , { collection: 'shops' }); // explicit collection name);

ShopOwnerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

ShopOwnerSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Shops', ShopOwnerSchema);