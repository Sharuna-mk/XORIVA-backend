const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    role: {
        default: "user",
        type: String
    },
    payoutAccount: {
        accountType: { type: String, enum: ["upi", "bank"] },
        accountHolderName: { type: String, trim: true },
        upiId: { type: String, trim: true },
        bankName: { type: String, trim: true },
        accountNumberLast4: { type: String, trim: true },
        ifsc: { type: String, trim: true, uppercase: true },
        status: { type: String, enum: ["pending", "verified", "blocked"], default: "pending" },
        addedAt: { type: Date },
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    loginOtp: {
        type: String
    },
    loginOtpExpiry: {
        type: Date
    },
    otpLastSentAt: {
        type: Date
    },
    otpBlockedUntil: {
        type: Date
    },
    attemptCount: {
        type: Number,
        default: 0
    },
    otpAttemptsDate: {
        type: Date
    }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema);