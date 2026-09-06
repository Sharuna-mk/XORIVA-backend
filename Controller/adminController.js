const User = require("../Model/userModel");
const Product = require("../Model/productModel");
const Order = require("../Model/orderModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: email?.toLowerCase(), role: "admin" });
    if (!user || !user.isVerified || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "8h" });
    return res.json({ message: "Admin login successful", token, user: { username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ message: "Admin login failed" });
  }
};

const allowedProductFields = [
  "title", "description", "brand", "sku", "category", "normalizedCategory", "gender", "tags",
  "price", "original_price_inr", "final_price_inr", "discountPercentage", "stock", "minimumOrderQuantity",
  "sizes", "sizeStock", "thumbnail", "images", "availabilityStatus", "material", "productCare",
  "shippingInformation", "warrantyInformation", "returnPolicy",
];

const pick = (source, fields) => fields.reduce((result, field) => {
  if (source[field] !== undefined) result[field] = source[field];
  return result;
}, {});

exports.dashboard = async (req, res) => {
  try {
    const [users, products, thriftPending, orders, paidOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ listingType: { $ne: "thrift" } }),
      Product.countDocuments({ listingType: "thrift", listingStatus: "pending_review" }),
      Order.countDocuments(),
      Order.find({ paymentStatus: "paid" }).select("totalAmount"),
    ]);
    const revenue = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const platformFees = paidOrders.reduce((sum, order) => sum + (order.platformFee || 0), 0);
    return res.json({ users, products, thriftPending, orders, revenue, platformFees });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};

exports.users = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const query = search ? { $or: [{ username: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
    const users = await User.find(query).select("username email phone role isVerified payoutAccount createdAt").sort({ createdAt: -1 }).limit(200);
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load users" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (req.params.id === req.payload.id && role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin access" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("username email role");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Role updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update role" });
  }
};

exports.products = async (req, res) => {
  try {
    const query = {};
    if (["retail", "thrift"].includes(req.query.type)) query.listingType = req.query.type;
    if (req.query.status) query.listingStatus = req.query.status;
    if (req.query.search?.trim()) query.$text = { $search: req.query.search.trim() };
    const products = await Product.find(query).populate("sellerId", "username email").sort({ createdAt: -1 }).limit(300);
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load products" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title?.trim() || !body.category || Number(body.final_price_inr) < 0) {
      return res.status(400).json({ message: "Title, category, and valid price are required" });
    }
    const product = await Product.create({
      ...pick(body, allowedProductFields),
      title: body.title.trim(),
      listingType: "retail",
      listingStatus: "approved",
      original_price_inr: Number(body.original_price_inr ?? body.final_price_inr),
      final_price_inr: Number(body.final_price_inr),
      stock: Number(body.stock || 0),
    });
    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return res.status(400).json({ message: "Failed to create product", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updates = pick(req.body || {}, allowedProductFields);
    if (updates.final_price_inr !== undefined) updates.final_price_inr = Number(updates.final_price_inr);
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ message: "Product updated", product });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update product", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
};

exports.moderateThrift = async (req, res) => {
  try {
    const { listingStatus } = req.body;
    if (!["approved", "rejected", "pending_review", "withdrawn"].includes(listingStatus)) {
      return res.status(400).json({ message: "Invalid thrift status" });
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, listingType: "thrift" },
      { listingStatus },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Thrift listing not found" });
    return res.json({ message: "Thrift status updated", product });
  } catch (error) {
    return res.status(400).json({ message: "Failed to moderate thrift listing" });
  }
};

exports.orders = async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "username email phone").populate("items.productId", "title thumbnail listingType sellerId").sort({ createdAt: -1 }).limit(300);
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load orders" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, payoutStatus } = req.body;
    const updates = {};
    if (orderStatus && ["created", "confirmed", "shipped", "delivered", "cancelled", "returned"].includes(orderStatus)) {
      updates.orderStatus = orderStatus;
      if (orderStatus === "delivered") updates.deliveredAt = new Date();
    }
    if (paymentStatus && ["pending", "paid", "failed", "refunded"].includes(paymentStatus)) updates.paymentStatus = paymentStatus;
    if (payoutStatus && ["not_applicable", "pending", "eligible", "paid", "failed"].includes(payoutStatus)) updates.payoutStatus = payoutStatus;
    if (!Object.keys(updates).length) return res.status(400).json({ message: "No valid status supplied" });
    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ message: "Order updated", order });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update order" });
  }
};

exports.updatePayoutStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["pending", "verified", "blocked"].includes(status)) return res.status(400).json({ message: "Invalid payout status" });
    const user = await User.findByIdAndUpdate(req.params.id, { "payoutAccount.status": status }, { new: true }).select("username email payoutAccount");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Payout status updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update payout status" });
  }
};

exports.resolveReturn = async (req, res) => {
  try {
    const { status, note } = req.body || {};
    if (!["approved", "rejected", "completed"].includes(status)) return res.status(400).json({ message: "Invalid return status" });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.returnRequest?.status !== "requested" && status !== "completed") return res.status(400).json({ message: "No pending return request" });
    order.returnRequest.status = status;
    order.returnRequest.note = note?.trim();
    order.returnRequest.resolvedAt = new Date();
    if (status === "completed") {
      order.orderStatus = "returned";
      if (order.paymentStatus === "paid" && order.paymentIntentId) {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        await stripe.refunds.create({ payment_intent: order.paymentIntentId, metadata: { orderId: order._id.toString(), reason: "approved_return" } });
        order.paymentStatus = "refunded";
      }
    }
    await order.save();
    return res.json({ message: "Return request updated", order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to resolve return" });
  }
};