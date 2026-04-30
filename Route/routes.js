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
const { chatController } = require('../Controller/chatController');

// Auth / OTP
router.post('/api/send-signup-otp', rateLimiter, userController.sendSignupOTP);
router.post('/api/verify-signup-otp', userController.verifySignupOTP);

// Register
router.post('/api/register', userController.registerUser);

// Login
router.post('/api/login-password', userController.loginUsingPassword);
router.post('/api/generate-otp', rateLimiter, userController.otpGenerate);
router.post('/api/login-otp', userController.loginUsingOtp);
router.post('/api/google-login', userController.googleLogin);

//findUser
router.post('/api/user-list', userController.User);

// User actions 
router.put('/api/user/:id', jwtMiddleware, userController.updateUser);
router.delete('/api/user/:id', jwtMiddleware, userController.deleteUser);

//product
router.get("/newArrivals", productController.getNewArrivals);   
router.get("/bestSeller", productController.getBestSellers);    
 

router.get("/all-product", productController.getAllProducts);  
 
// Search
router.get("/search", productController.searchProducts);        
 
router.get("/product/:id", productController.getProductById); 


//wishlist
router.get("/api/wishlist/",jwtMiddleware,wishlistController.getWishlist)
router.post("/api/wishlist/add/:id",jwtMiddleware,wishlistController.toggleWishlist)
router.delete("/api/wishlist/remove/:id",jwtMiddleware,wishlistController.removeFromWishlist)

//address

router.post('/api/address/create', jwtMiddleware, addressController.createAddress);
router.get('/api/address', jwtMiddleware, addressController.getAddress);
router.put('/api/address/update/:id', jwtMiddleware, addressController.editAddress);
router.delete('/api/address/delete/:id', jwtMiddleware, addressController.deleteAddress);

//cart 

router.get("/api/cart", jwtMiddleware, cartController.getCart);

router.post("/api/cart/add", jwtMiddleware, cartController.addToCart);

router.delete("/api/cart/decrease", jwtMiddleware, cartController.decreaseQuantity);

router.delete("/api/cart/removeItem", jwtMiddleware, cartController.removeFromCart);

router.delete("/api/cart/remove", jwtMiddleware, cartController.clearCart);

//order
router.post("/api/order/create", jwtMiddleware, orderController.createOrder);

router.post("/api/order/confirm", jwtMiddleware, orderController.confirmPayment);

router.post("/api/order/fail", jwtMiddleware, orderController.failPayment);

router.get("/api/orders", jwtMiddleware, orderController.allOrder);

router.post('/api/chat', chatController);

module.exports = router;