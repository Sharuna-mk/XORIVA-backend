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