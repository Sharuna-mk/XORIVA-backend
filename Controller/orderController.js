const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require("../Model/orderModel");
const Address = require("../Model/addressModel");
const Product = require("../Model/productModel");
const Cart = require("../Model/cartModel");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { addressId, paymentMethod = "online" } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    let subtotal = 0;
    let thriftSubtotal = 0;
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

      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      if (product.listingType === "thrift") thriftSubtotal += lineTotal;

      orderItems.push({
        productId: product._id,
        name: product.title,
        size: size || "ONE_SIZE",
        price,
        quantity: item.quantity
      });
    }

    const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT || 10);
    const platformFee = Math.round((thriftSubtotal * platformFeePercent) / 100);
    const codCharge = paymentMethod === "cod" ? 10 : 0;
    const totalAmount = subtotal + platformFee + codCharge;
    const order = await Order.create({
      userId,
      items: orderItems,
      shippingAddress: address,
      totalAmount,
      subtotal,
      thriftSubtotal,
      platformFeePercent,
      platformFee,
      sellerPayoutAmount: thriftSubtotal,
      payoutStatus: thriftSubtotal > 0 ? "pending" : "not_applicable",
      paymentMethod: paymentMethod === "cod" ? "cod" : "online",
      paymentStatus: "pending",
      orderStatus: "created"
    });

    if (paymentMethod === "cod") {
      await Cart.findOneAndUpdate({ user: userId }, { items: [] });
      return res.status(200).json({ orderId: order._id, totalAmount, cod: true });
    }

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
      const stockUpdate = item.size && item.size !== "ONE_SIZE"
        ? { $inc: { [`sizeStock.${item.size}`]: -item.quantity } }
        : { $inc: { stock: -item.quantity } };
      await Product.findByIdAndUpdate(item.productId, stockUpdate);
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

exports.sellerOrders = async (req, res) => {
  try {
    const sellerProducts = await Product.find({ sellerId: req.payload.id, listingType: "thrift" }).select("_id");
    const sellerProductIds = sellerProducts.map((product) => product._id);
    const orders = await Order.find({ "items.productId": { $in: sellerProductIds } })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    const sellerOrders = orders.map((order) => ({
      ...order.toObject(),
      items: order.items.filter((item) => item.productId?.sellerId?.toString() === req.payload.id),
    })).filter((order) => order.items.length > 0);

    return res.status(200).json(sellerOrders);
  } catch (error) {
    console.error("SELLER ORDERS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch thrift sales" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.payload.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["created", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "This order can no longer be cancelled" });
    }
    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    if (order.paymentMethod === "cod") order.paymentStatus = "failed";
    if (order.paymentStatus === "paid" && order.paymentIntentId) {
      await stripe.refunds.create({ payment_intent: order.paymentIntentId, metadata: { orderId: order._id.toString(), reason: "customer_cancellation" } });
      order.paymentStatus = "refunded";
    }
    await order.save();
    return res.json({ message: "Order cancelled", order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel order" });
  }
};

exports.requestReturn = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const order = await Order.findOne({ _id: req.params.id, userId: req.payload.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.orderStatus !== "delivered") return res.status(400).json({ message: "Returns are available after delivery" });
    if (order.deliveredAt && Date.now() - order.deliveredAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "The 30-day return window has ended" });
    }
    if (!reason?.trim()) return res.status(400).json({ message: "Return reason is required" });
    if (order.returnRequest?.status && order.returnRequest.status !== "none") return res.status(400).json({ message: "A return request already exists" });
    order.returnRequest = { status: "requested", reason: reason.trim(), requestedAt: new Date() };
    await order.save();
    return res.json({ message: "Return request submitted", order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to request return" });
  }
};