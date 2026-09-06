const Product = require("../Model/productModel");
const User = require("../Model/userModel");
const Order = require("../Model/orderModel");

const getSellerId = (req) => req.payload?.id;
const retailProductFilter = {
  listingType: { $ne: "thrift" },
  listingStatus: { $in: ["approved", null] },
};

const getListingImages = (images) => Array.isArray(images)
  ? images.filter((image) => typeof image === "string" && image.startsWith("data:image/"))
  : [];

exports.createThriftDraft = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const { title, brand, description, price, categories = [], itemCategory, color, material, fit, pattern, measurements, size, customSize, condition, era, quantity = 1, images = [] } = req.body;
    if (!sellerId) return res.status(401).json({ message: "Login required" });

    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);
    const safePrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0;
    const safeQuantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
    const validImages = getListingImages(images);
    const sizes = size ? [size === "Custom" ? customSize?.trim() : size].filter(Boolean) : [];

    const product = await Product.create({
      title: title?.trim() || "Untitled thrift listing",
      brand: brand?.trim(),
      description: description?.trim(),
      category: categories[0],
      tags: Array.isArray(categories) ? categories : [],
      listingType: "thrift",
      listingStatus: "draft",
      sellerId,
      condition: condition || undefined,
      era,
      itemCategory, color, material, fit, pattern, measurements,
      original_price_inr: safePrice,
      final_price_inr: safePrice,
      price: safePrice,
      stock: safeQuantity,
      minimumOrderQuantity: 1,
      sizes,
      sizeStock: sizes.reduce((stock, item) => ({ ...stock, [item]: safeQuantity }), {}),
      thumbnail: validImages[0],
      images: validImages,
      availabilityStatus: "Out of Stock",
    });

    return res.status(201).json({ message: "Draft saved", product });
  } catch (error) {
    console.error("createThriftDraft error:", error);
    return res.status(500).json({ message: "Failed to save draft", error: error.message });
  }
};

exports.getThriftProducts = async (req, res) => {
  try {
    const query = { listingType: "thrift", listingStatus: "approved", stock: { $gt: 0 } };
    if (req.payload?.id) query.sellerId = { $ne: req.payload.id };
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .select("title brand thumbnail images rating final_price_inr original_price_inr discountPercentage availabilityStatus gender category itemCategory tags condition era color material fit pattern measurements sizes sizeStock sellerId");
    return res.status(200).json({ products });
  } catch (error) {
    console.error("getThriftProducts error:", error);
    return res.status(500).json({ message: "Failed to fetch thrift products" });
  }
};

exports.createThriftListing = async (req, res) => {
  try {
    const sellerId = getSellerId(req);
    const { title, brand, description, price, categories, itemCategory, color, material, fit, pattern, measurements, size, customSize, condition, era, quantity = 1, images = [] } = req.body;
    if (!sellerId) return res.status(401).json({ message: "Login required" });
    const seller = await User.findById(sellerId).select("payoutAccount");
    if (seller?.payoutAccount?.status !== "verified") {
      return res.status(400).json({ message: "Your payout account must be added and verified by admin before publishing" });
    }
    if (!title?.trim() || !description?.trim() || !condition || !price || !Array.isArray(categories) || !categories.length) {
      return res.status(400).json({ message: "Complete all required listing fields" });
    }
    if (!Array.isArray(images) || images.length === 0 || images.some((image) => typeof image !== "string" || !image.startsWith("data:image/"))) {
      return res.status(400).json({ message: "At least one valid product image is required" });
    }
    if (images.length > 7 || images.some((image) => image.length > 2_500_000)) {
      return res.status(400).json({ message: "Each image must be smaller than 2MB" });
    }
    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: "Price and quantity must be valid" });
    }
    const sizes = size ? [size === "Custom" ? customSize?.trim() : size].filter(Boolean) : [];
    const product = await Product.create({
      title: title.trim(), brand: brand?.trim(), description: description.trim(), category: categories[0], tags: categories,
      listingType: "thrift", listingStatus: "approved", sellerId, condition, era,
      itemCategory, color, material, fit, pattern, measurements,
      original_price_inr: parsedPrice, final_price_inr: parsedPrice, price: parsedPrice,
      stock: parsedQuantity, minimumOrderQuantity: 1, sizes,
      sizeStock: sizes.reduce((stock, item) => ({ ...stock, [item]: parsedQuantity }), {}),
      thumbnail: images[0], images, availabilityStatus: "In Stock",
    });
    return res.status(201).json({ message: "Thrift listing created", product });
  } catch (error) {
    console.error("createThriftListing error:", error);
    return res.status(500).json({ message: "Failed to create thrift listing", error: error.message });
  }
};

exports.getMyThriftListings = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: getSellerId(req), listingType: "thrift" }).sort({ createdAt: -1 });
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch your thrift listings" });
  }
};

exports.withdrawThriftListing = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: getSellerId(req), listingType: "thrift", listingStatus: { $in: ["approved", "pending_review"] } },
      { listingStatus: "withdrawn", stock: 0, availabilityStatus: "Out of Stock" }, { new: true }
    );
    if (!product) return res.status(404).json({ message: "Listing not found" });
    return res.status(200).json({ message: "Listing withdrawn", product });
  } catch (error) {
    return res.status(500).json({ message: "Failed to withdraw listing" });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find(retailProductFilter).sort({createdAt:1}).limit(5)
      .select(
        "title brand thumbnail rating final_price_inr original_price_inr discountPercentage _id"
      );

    return res.status(200).json({ productList: products });
  } catch (error) {
    console.error("getNewArrivals error:", error);
    return res.status(500).json({ message: "Failed to fetch new arrivals" });
  }
};

exports.getBestSellers = async (req, res) => {
  try {
    const products = await Product.find(retailProductFilter).sort({rating:-1})
      .limit(5)
      .select(
        "title brand thumbnail rating final_price_inr original_price_inr discountPercentage _id"
      );

    return res.status(200).json({ products });
  } catch (error) {
    console.error("getBestSellers error:", error);
    return res.status(500).json({ message: "Failed to fetch best sellers" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("sellerId", "username");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.listingType === "thrift" && req.payload?.id && product.sellerId?._id?.toString() === req.payload.id) {
      return res.status(404).json({ message: "Your own thrift listing is available from Account > My listings" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error("getProductById error:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};

exports.createReview = async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    const comment = req.body?.comment?.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({ message: "Rating and review comment are required" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const purchased = await Order.exists({
      userId: req.payload.id,
      orderStatus: "delivered",
      paymentStatus: { $in: ["paid", "pending"] },
      "items.productId": product._id,
    });
    if (!purchased) return res.status(403).json({ message: "Buy this product before reviewing it" });
    const user = await User.findById(req.payload.id).select("username email");
    const review = { rating, comment, reviewerName: user?.username || "Customer", reviewerEmail: user?.email };
    product.reviews = product.reviews.filter((item) => item.reviewerEmail !== user?.email);
    product.reviews.push(review);
    product.rating = product.reviews.reduce((sum, item) => sum + item.rating, 0) / product.reviews.length;
    await product.save();
    return res.status(201).json({ message: "Review added", review, rating: product.rating });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add review" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find(retailProductFilter)
      .sort({ createdAt: -1 })
      .select(
        "title brand thumbnail rating final_price_inr original_price_inr discountPercentage availabilityStatus _id gender"
      );

    return res.status(200).json({ products });
  } catch (error) {
    console.error("getAllProducts error:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const products = await Product.find(
      { ...retailProductFilter, $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(30)
      .select(
        "title brand thumbnail rating final_price_inr original_price_inr discountPercentage _id"
      );

    return res.status(200).json(products);
  } catch (error) {
    console.error("searchProducts error:", error);
    return res.status(500).json({ message: "Search failed" });
  }
};

// exports.searchProducts = async (req, res) => {
//     try {
//         const { query } = req.query;
//         const products = await Product.find();
//         const fuse = new Fuse(products, {
//             keys: ["title", "description"],
//             threshold: 0.4,
//         });
//         const result = fuse.search(query).map(r => r.item);
//         res.status(200).json(result); 
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// }