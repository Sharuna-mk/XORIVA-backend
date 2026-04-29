const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: String,
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

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    orderStatus: {
      type: String,
      enum: ["created", "confirmed", "cancelled"],
      default: "created"
    },

    paymentIntentId: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);