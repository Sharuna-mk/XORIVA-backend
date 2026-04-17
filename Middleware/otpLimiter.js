const rateLimiter = require(`express-rate-limit`)

const otpLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 OTP requests per windowMs
    message: "Too many OTP requests from this IP, please try again after 5 minutes"
})

module.exports = otpLimiter