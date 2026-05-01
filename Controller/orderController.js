const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require("../Model/orderModel");
const Address = require("../Model/addressModel");
const Product = require("../Model/productModel");
const Cart = require("../Model/cartModel");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { addressId } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    let totalAmount = 0;
    let orderItems = [];

    for (let item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({ message: "Invalid product in cart" });
      }

      const size = item.size?.toUpperCase();
      let stock = size ? product.sizeStock?.get(size) : product.stock;

      if (!stock || stock < item.quantity) {
        return res.status(400).json({
          message: `${product.title} out of stock`
        });
      }

      const price = product.final_price_inr;

      totalAmount += price * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.title,
        price,
        quantity: item.quantity
      });
    }

    const order = await Order.create({
      userId,
      items: orderItems,
      shippingAddress: address,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "created"
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "inr",
      metadata: {
        orderId: order._id.toString()
      }
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.allOrder = async (req, res) => {
  try {
    const userId = req.payload.id;

    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (error) {
    res.status(500).json({
      message: "server error",
      error: error.message
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    await order.save();

    // stock deduction
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    await Cart.findOneAndUpdate(
      { user: order.userId },
      { items: [] }
    );

    res.json({ message: "Payment successful" });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.failPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = "failed";
    order.orderStatus = "cancelled";
    await order.save();

    res.json({ message: "Order marked as failed" });

  } catch (err) {
    console.error("FAIL PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};