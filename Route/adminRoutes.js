const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../Middleware/jwtMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");
const adminController = require("../Controller/adminController");

router.post("/login", adminController.login);
router.use(jwtMiddleware, adminMiddleware);
router.get("/dashboard", adminController.dashboard);
router.get("/users", adminController.users);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/payout", adminController.updatePayoutStatus);
router.get("/products", adminController.products);
router.post("/products", adminController.createProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);
router.patch("/thrift/:id/status", adminController.moderateThrift);
router.get("/orders", adminController.orders);
router.patch("/orders/:id/status", adminController.updateOrderStatus);
router.patch("/orders/:id/return", adminController.resolveReturn);

module.exports = router;