const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: String,
  size: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phoneNum: String,
      address: String,
      city: String,
      pinCode: String
    },

    totalAmount: Number,
    subtotal: { type: Number, default: 0 },
    thriftSubtotal: { type: Number, default: 0 },
    platformFeePercent: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    sellerPayoutAmount: { type: Number, default: 0 },
    payoutStatus: {
      type: String,
      enum: ["not_applicable", "pending", "eligible", "paid", "failed"],
      default: "not_applicable",
    },
    paymentMethod: { type: String, enum: ["online", "cod"], default: "online" },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },

    orderStatus: {
      type: String,
      enum: ["created", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "created"
    },

    returnRequest: {
      status: { type: String, enum: ["none", "requested", "approved", "rejected", "completed"], default: "none" },
      reason: String,
      requestedAt: Date,
      resolvedAt: Date,
      note: String,
    },
    cancelledAt: Date,
    deliveredAt: Date,

    paymentIntentId: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);