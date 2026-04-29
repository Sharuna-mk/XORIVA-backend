const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNum: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    pinCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{6}$/, "Pin code must be 6 digits"],
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Address", addressSchema);