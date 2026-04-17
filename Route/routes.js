const express = require('express');
const router = express.Router();

const userController = require('../Controller/userController');
const rateLimiter = require('../Middleware/otpLimiter');
const jwtMiddleware = require('../Middleware/jwtMiddleware');

// Auth / OTP
router.post('/api/send-signup-otp', rateLimiter, userController.sendSignupOTP);
router.post('/api/verify-signup-otp', userController.verifySignupOTP);

// Register
router.post('/api/register', userController.registerUser);

// Login
router.post('/api/login-password', userController.loginUsingPassword);
router.post('/api/generate-otp', rateLimiter, userController.otpGenerate);
router.post('/api/login-otp', userController.loginUsingOtp);

//findUser
router.post('/api/user-list', userController.User);

// User actions 
router.put('/api/user/:id', jwtMiddleware, userController.updateUser);
router.delete('/api/user/:id', jwtMiddleware, userController.deleteUser);

module.exports = router;