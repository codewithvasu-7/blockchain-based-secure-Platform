const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    did: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["NONE", "ADMIN", "MANAGER", "AUDITOR", "USER"],
      default: "NONE",
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

module.exports = mongoose.model("User", userSchema);