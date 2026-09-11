const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    blockchainId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    action: {
      type: Number,
      required: true,
    },

    actionName: {
      type: String,
      required: true,
    },

    actor: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    targetId: {
      type: String,
      required: true,
    },

    details: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);