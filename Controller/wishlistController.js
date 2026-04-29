const Wishlist = require("../Model/wishlistModel");

exports.toggleWishlist = async (req, res) => {
  try {
    const user = req.payload.id;
    const product = req.params.id;

    const existing = await Wishlist.findOne({ user, product });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });

      return res.status(200).json({
        message: "Removed from wishlist",
        isWishListed: false,
      });
    }

    await Wishlist.create({ user, product });

    return res.status(201).json({
      message: "Added to wishlist",
      isWishListed: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const product = req.params.id;
    const user = req.payload.id;
    const deleted = await Wishlist.findOneAndDelete({ product, user, isWishListed: false });
    console.log(deleted);
    if (!deleted) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }
    res.status(200).json({ message: "Removed from wishlist", isWishListed: false });
  }
  catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = req.payload.id;

    const wishlist = await Wishlist.find({ user })
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json(wishlist);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};