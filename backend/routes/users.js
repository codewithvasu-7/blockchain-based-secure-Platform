const express = require("express");
const { ethers } = require("ethers");

const {
  identityContract,
  identityWrite,
} = require("../blockchain");

const {
  getErrorMessage,
} = require("../utils/errors");

const User = require("../models/User");

const router = express.Router();

// ============================================================
// GET USER
// GET /api/users/:wallet
// ============================================================

router.get("/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet;

    // Validate wallet address
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address",
      });
    }

    // ========================================================
    // BLOCKCHAIN = SOURCE OF TRUTH
    // ========================================================

    const user = await identityContract.getUser(wallet);

    // User does not exist on blockchain
    if (!user[1]) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = {
      name: user[0],
      did: user[1],
      active: user[2],
    };

    // ========================================================
    // SAVE / UPDATE USER IN MONGODB
    // ========================================================

    const dbUser = await User.findOneAndUpdate(
      {
        wallet: wallet.toLowerCase(),
      },
      {
        wallet: wallet.toLowerCase(),
        name: userData.name,
        did: userData.did,
        active: userData.active,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    res.json({
      success: true,

      wallet,

      user: userData,

      database: {
        saved: true,
        id: dbUser._id,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// ============================================================
// CREATE USER
// POST /api/users
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      wallet,
      name,
      did,
    } = req.body || {};

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "User name is required",
      });
    }

    if (!did || !did.trim()) {
      return res.status(400).json({
        success: false,
        error: "DID is required",
      });
    }

    // ========================================================
    // 1. CREATE USER ON BLOCKCHAIN
    // ========================================================

    const tx = await identityWrite.createUser(
      wallet,
      name.trim(),
      did.trim()
    );

    // Wait for blockchain confirmation
    const receipt = await tx.wait();

    // ========================================================
    // 2. SAVE USER IN MONGODB
    // ========================================================

    const dbUser = await User.findOneAndUpdate(
      {
        wallet: wallet.toLowerCase(),
      },
      {
        wallet: wallet.toLowerCase(),
        name: name.trim(),
        did: did.trim(),
        active: true,

        // Blockchain transaction information
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    res.status(201).json({
      success: true,

      message: "User created successfully",

      transactionHash: tx.hash,

      blockNumber: receipt.blockNumber,

      database: {
        saved: true,
        id: dbUser._id,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// ============================================================
// DEACTIVATE USER
// PATCH /api/users/:wallet/deactivate
// ============================================================

router.patch(
  "/:wallet/deactivate",
  async (req, res) => {
    try {
      const wallet = req.params.wallet;

      // ======================================================
      // VALIDATE WALLET
      // ======================================================

      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({
          success: false,
          error: "Invalid wallet address",
        });
      }

      // ======================================================
      // 1. DEACTIVATE USER ON BLOCKCHAIN
      // ======================================================

      const tx = await identityWrite.deactivateUser(
        wallet
      );

      // Wait for blockchain confirmation
      const receipt = await tx.wait();

      // ======================================================
      // 2. UPDATE USER IN MONGODB
      // ======================================================

      const dbUser = await User.findOneAndUpdate(
        {
          wallet: wallet.toLowerCase(),
        },
        {
          active: false,

          transactionHash: tx.hash,

          blockNumber: receipt.blockNumber,
        },
        {
          new: true,
        }
      );

      // ======================================================
      // RESPONSE
      // ======================================================

      res.json({
        success: true,

        message: "User deactivated successfully",

        transactionHash: tx.hash,

        blockNumber: receipt.blockNumber,

        database: {
          saved: !!dbUser,
        },
      });
    } catch (error) {
      console.error(
        "Deactivate user error:",
        error
      );

      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;