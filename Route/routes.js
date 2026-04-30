const express = require('express');
const router = express.Router();

const userController = require('../Controller/userController');
const rateLimiter = require('../Middleware/otpLimiter');
const jwtMiddleware = require('../Middleware/jwtMiddleware');
const productController = require('../Controller/productController')
const wishlistController = require('../Controller/wishlistController')
const addressController = require('../Controller/addressController')
const cartController = require("../Controller/cartController");
const orderController = require("../Controller/orderController");
const chatController = require('../Controller/chatController');

// Auth / OTP
router.post('/send-signup-otp', rateLimiter, userController.sendSignupOTP);
router.post('/verify-signup-otp', userController.verifySignupOTP);
router.post('/register', userController.registerUser);
router.post('/login-password', userController.loginUsingPassword);
router.post('/generate-otp', rateLimiter, userController.otpGenerate);
router.post('/login-otp', userController.loginUsingOtp);
router.post('/google-login', userController.googleLogin);
router.post('/user-list', userController.User);
router.put('/user/:id', jwtMiddleware, userController.updateUser);
router.delete('/user/:id', jwtMiddleware, userController.deleteUser);

// Products
router.get('/newArrivals', productController.getNewArrivals);
router.get('/bestSeller', productController.getBestSellers);
router.get('/all-product', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/product/:id', productController.getProductById);

// Wishlist
router.get('/wishlist', jwtMiddleware, wishlistController.getWishlist);
router.post('/wishlist/add/:id', jwtMiddleware, wishlistController.toggleWishlist);
router.delete('/wishlist/remove/:id', jwtMiddleware, wishlistController.removeFromWishlist);

// Address
router.post('/address/create', jwtMiddleware, addressController.createAddress);
router.get('/address', jwtMiddleware, addressController.getAddress);
router.put('/address/update/:id', jwtMiddleware, addressController.editAddress);
router.delete('/address/delete/:id', jwtMiddleware, addressController.deleteAddress);

// Cart
router.get('/cart', jwtMiddleware, cartController.getCart);
router.post('/cart/add', jwtMiddleware, cartController.addToCart);
router.delete('/cart/decrease', jwtMiddleware, cartController.decreaseQuantity);
router.delete('/cart/removeItem', jwtMiddleware, cartController.removeFromCart);
router.delete('/cart/remove', jwtMiddleware, cartController.clearCart);

// Orders
router.post('/order/create', jwtMiddleware, orderController.createOrder);
router.post('/order/confirm', jwtMiddleware, orderController.confirmPayment);
router.post('/order/fail', jwtMiddleware, orderController.failPayment);
router.get('/orders', jwtMiddleware, orderController.allOrder);

// Chat
router.post('/chat', chatController.chatController);

module.exports = router;