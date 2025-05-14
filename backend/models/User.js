const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletBalance: { type: Number, default: 0 },
    gender: { type: Number, enum: [1, 2], default: 1 },
    portrait: { type: String, default: '/public/image/default_avatar.png' },
    resetPasswordToken: { type: String },         // 🔐 New field
    resetPasswordExpire: { type: Date },          // ⏳ New field

  });
  

const User = mongoose.model('User', userSchema);

module.exports = User;
