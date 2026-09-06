const dns = require("dns");
dns.setServers(["1.1.1.1"]);
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../Model/productModel");

const demoProducts = [
  {
    sku: "THRIFT-DEMO-DENIM-001",
    title: "90s Relaxed Blue Denim",
    brand: "Levi's",
    description: "Pre-loved relaxed-fit blue denim with a softly faded wash and plenty of life left. A classic everyday pair with a comfortable mid-rise waist.",
    category: "Pants / Jeans",
    itemCategory: "Jeans",
    tags: ["Vintage 90s", "Pants / Jeans", "Streetwear"],
    color: "Faded blue",
    material: "Denim",
    fit: "Relaxed",
    pattern: "Solid",
    condition: "Good",
    era: "1990s",
    sizes: ["M"],
    sizeStock: { M: 1 },
    measurements: { waist: "30", inseam: "30", length: "40" },
    price: 1299,
    original_price_inr: 1299,
    final_price_inr: 1299,
    stock: 1,
    thumbnail: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85",
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85"],
  },
  {
    sku: "THRIFT-DEMO-DRESS-001",
    title: "Floral Midi Slip Dress",
    brand: "Mango",
    description: "A lightweight floral midi dress in a flattering slip silhouette. Easy to style with boots, sandals, or a cropped jacket for a night out.",
    category: "Dresses",
    itemCategory: "Dress",
    tags: ["Dresses", "Minimalist", "Floral"],
    color: "Black and cream",
    material: "Viscose",
    fit: "Regular",
    pattern: "Floral",
    condition: "Like New",
    era: "2020s",
    sizes: ["S"],
    sizeStock: { S: 1 },
    measurements: { chest: "34", waist: "28", length: "46" },
    price: 1599,
    original_price_inr: 1599,
    final_price_inr: 1599,
    stock: 1,
    thumbnail: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85"],
  },
  {
    sku: "THRIFT-DEMO-JACKET-001",
    title: "Olive Utility Overshirt",
    brand: "Carhartt",
    description: "A sturdy olive utility overshirt with practical pockets and an oversized fit. Lightly worn, clean, and ideal as a layering piece through the year.",
    category: "Jackets / Outerwear",
    itemCategory: "Jacket",
    tags: ["Streetwear", "Jackets / Outerwear", "Minimalist"],
    color: "Olive green",
    material: "Cotton twill",
    fit: "Oversized",
    pattern: "Solid",
    condition: "Good",
    era: "2010s",
    sizes: ["L"],
    sizeStock: { L: 1 },
    measurements: { chest: "44", length: "29" },
    price: 1899,
    original_price_inr: 1899,
    final_price_inr: 1899,
    stock: 1,
    thumbnail: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85"],
  },
  {
    sku: "THRIFT-DEMO-SHIRT-001",
    title: "Striped Cotton Button Shirt",
    brand: "Uniqlo",
    description: "Soft cotton button-down with a clean blue stripe, regular fit, and an easy-to-wear shape. Freshly cleaned and ready for everyday rotation.",
    category: "Shirts",
    itemCategory: "Shirt",
    tags: ["Shirts", "Office Wear", "Minimalist"],
    color: "Blue and white",
    material: "Cotton",
    fit: "Regular",
    pattern: "Striped",
    condition: "Like New",
    era: "2020s",
    sizes: ["M"],
    sizeStock: { M: 1 },
    measurements: { chest: "40", length: "28" },
    price: 899,
    original_price_inr: 899,
    final_price_inr: 899,
    stock: 1,
    thumbnail: "https://tse1.explicit.bing.net/th/id/OIP.0Hi0i_2f1qw4L_zRu3-ljQHaJQ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    images: ["https://tse1.explicit.bing.net/th/id/OIP.0Hi0i_2f1qw4L_zRu3-ljQHaJQ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await Product.collection.dropIndex("id_1");
    console.log("Removed obsolete products.id_1 index.");
  } catch (error) {
    if (error.code !== 27) throw error;
  }
  for (const product of demoProducts) {
    await Product.findOneAndUpdate(
      { sku: product.sku },
      { ...product, listingType: "thrift", listingStatus: "approved", availabilityStatus: "In Stock" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Seeded ${demoProducts.length} thrift demo products.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Thrift seed failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});