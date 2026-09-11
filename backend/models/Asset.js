const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    tokenId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    assetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    assetName: {
      type: String,
      required: true,
      trim: true,
    },

    assetType: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    transactionHash: {
      type: String,
      default: null,
    },

    blockNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Asset", assetSchema);