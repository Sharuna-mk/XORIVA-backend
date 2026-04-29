const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now },
    reviewerName: { type: String },
    reviewerEmail: { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
   
    title: { type: String, required: true, trim: true },
    description: { type: String },
    brand: { type: String, trim: true },
    sku: { type: String },

    category: { type: String },          
    normalizedCategory: { type: String },
    gender: { type: String, enum: ["men", "women", "unisex", "kids"] },
    tags: [{ type: String }],

    price: { type: Number },                        
    original_price_inr: { type: Number, required: true },
    final_price_inr: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },


    stock: { type: Number, default: 0 },
    minimumOrderQuantity: { type: Number, default: 1 },
    sizes: [{ type: String }],                        
    sizeStock: { type: Map, of: Number, default: {} }, 
    weight: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
    },
    availabilityStatus: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },

    material: { type: String },
    productCare: [{ type: String }],

    thumbnail: { type: String },
    images: [{ type: String }],


    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [reviewSchema],


    shippingInformation: { type: String },
    warrantyInformation: { type: String },
    returnPolicy: { type: String },


    meta: {
      createdAt: { type: Date },
      updatedAt: { type: Date },
      barcode: { type: String },
      qrCode: { type: String },
    },
  },
  {
    timestamps: true,
  }
);



productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ title: "text", description: "text", brand: "text" });

module.exports= mongoose.model("Product", productSchema);
