const Product = require("../Model/productModel");

exports.getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find().sort({createdAt:-1}).limit(5)
      .sort({ createdAt: -1 })
      .limit(10)
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
    const products = await Product.find().sort({rating:-1}).limit(5)
      .sort({ rating: -1 })
      .limit(10)
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
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error("getProductById error:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .select(
        "title brand thumbnail rating final_price_inr original_price_inr discountPercentage availabilityStatus _id"
      );

    return res.status(200).json({ products });
  } catch (error) {
    console.error("getAllProducts error:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

// exports.searchProducts = async (req, res) => {
//   try {
//     const { query } = req.query;

//     if (!query || query.trim() === "") {
//       return res.status(400).json({ message: "Search query is required" });
//     }

//     const products = await Product.find(
//       { $text: { $search: query } },
//       { score: { $meta: "textScore" } }
//     )
//       .sort({ score: { $meta: "textScore" } })
//       .limit(30)
//       .select(
//         "title brand thumbnail rating final_price_inr original_price_inr discountPercentage _id"
//       );

//     return res.status(200).json(products);
//   } catch (error) {
//     console.error("searchProducts error:", error);
//     return res.status(500).json({ message: "Search failed" });
//   }
// };

exports.searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        const products = await Product.find();
        const fuse = new Fuse(products, {
            keys: ["title", "description"],
            threshold: 0.4,
        });
        const result = fuse.search(query).map(r => r.item);
        res.status(200).json(result); 
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}