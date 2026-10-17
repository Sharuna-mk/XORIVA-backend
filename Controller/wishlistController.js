const mongoose = require("mongoose");
const Wishlist = require("../Model/wishlistModel");
const Product = require("../Model/productModel");
const User = require("../Model/userModel");

const getUserId = (req) => {
  return req.payload?.id || req.payload?._id || req.payload?.userId || (typeof req.payload === "string" ? req.payload : null);
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = getUserId(req);
    const product = req.params.id;

    if (!user || !mongoose.Types.ObjectId.isValid(user)) {
      return res.status(401).json({ message: "Unauthorized or invalid user token" });
    }

    if (!product || !mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const existing = await Wishlist.findOne({ user, product });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });

      return res.status(200).json({
        message: "Removed from wishlist",
        isWishListed: false,
      });
    }

    const created = await Wishlist.create({ user, product });
    const populated = await Wishlist.findById(created._id).populate("product");

    return res.status(201).json({
      message: "Added to wishlist",
      isWishListed: true,
      wishlist: populated,
    });
  } catch (err) {
    console.error("toggleWishlist error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const product = req.params.id;
    const user = getUserId(req);

    if (!user || !mongoose.Types.ObjectId.isValid(user)) {
      return res.status(401).json({ message: "Unauthorized or invalid user token" });
    }

    if (!product || !mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const deleted = await Wishlist.findOneAndDelete({ product, user });
    if (!deleted) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }
    res.status(200).json({ message: "Removed from wishlist", isWishListed: false });
  } catch (err) {
    console.error("removeFromWishlist error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = getUserId(req);

    if (!user || !mongoose.Types.ObjectId.isValid(user)) {
      return res.status(401).json({ message: "Unauthorized or invalid user token" });
    }

    const wishlist = await Wishlist.find({ user })
      .populate("product")
      .sort({ createdAt: -1 });

    // Filter out items whose referenced product was deleted
    const validWishlist = (wishlist || []).filter((item) => item && item.product);

    res.status(200).json(validWishlist);
  } catch (err) {
    console.error("getWishlist error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};