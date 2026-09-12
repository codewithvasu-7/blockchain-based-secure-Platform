const express = require("express");
const { ethers } = require("ethers");

const {
  rbacContract,
  rbacWrite,
} = require("../blockchain");

const {
  getErrorMessage,
} = require("../utils/errors");

const User = require("../models/User");

const router = express.Router();

// ============================================================
// ROLE NAMES
// ============================================================

const ROLE_NAMES = [
  "NONE",
  "ADMIN",
  "MANAGER",
  "AUDITOR",
  "USER",
];

// ============================================================
// GET ROLE
// GET /api/roles/:wallet
// ============================================================

router.get("/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet;

    // ========================================================
    // VALIDATE WALLET
    // ========================================================

    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address",
      });
    }

    // ========================================================
    // GET ROLE FROM BLOCKCHAIN
    // ========================================================

    const role =
      await rbacContract.getRole(wallet);

    const roleNumber =
      Number(role);

    const roleName =
      ROLE_NAMES[roleNumber] ||
      "UNKNOWN";

    // ========================================================
    // SYNC ROLE WITH MONGODB
    // ========================================================

    const dbUser =
      await User.findOneAndUpdate(
        {
          wallet: wallet.toLowerCase(),
        },
        {
          role: roleName,
        },
        {
          new: true,
        }
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    res.json({
      success: true,

      wallet,

      role: {
        id: roleNumber,
        name: roleName,
      },

      database: {
        synced: !!dbUser,
      },
    });
  } catch (error) {
    console.error(
      "Get role error:",
      error
    );

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// ============================================================
// ASSIGN ROLE
// POST /api/roles
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      wallet,
      role,
    } = req.body || {};

    // ========================================================
    // VALIDATE WALLET
    // ========================================================

    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address",
      });
    }

    // ========================================================
    // VALIDATE ROLE
    // ========================================================

    const roleNumber =
      Number(role);

    if (
      !Number.isInteger(roleNumber) ||
      roleNumber < 1 ||
      roleNumber > 4
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Role must be between 1 and 4",
      });
    }

    const roleName =
      ROLE_NAMES[roleNumber];

    // ========================================================
    // CHECK USER EXISTS IN MONGODB
    // ========================================================

    const existingUser =
      await User.findOne({
        wallet: wallet.toLowerCase(),
      });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error:
          "User is not registered. Create the user first.",
      });
    }

    // ========================================================
    // 1. ASSIGN ROLE ON BLOCKCHAIN
    // ========================================================

    const tx =
      await rbacWrite.assignRole(
        wallet,
        roleNumber
      );

    // Wait for confirmation
    const receipt =
      await tx.wait();

    // ========================================================
    // 2. UPDATE ROLE IN MONGODB
    // ========================================================

    const dbUser =
      await User.findOneAndUpdate(
        {
          wallet: wallet.toLowerCase(),
        },
        {
          role: roleName,

          transactionHash:
            tx.hash,

          blockNumber:
            receipt.blockNumber,
        },
        {
          new: true,
        }
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    res.json({
      success: true,

      message:
        `${roleName} role assigned successfully`,

      wallet,

      role: {
        id: roleNumber,
        name: roleName,
      },

      transactionHash:
        tx.hash,

      blockNumber:
        receipt.blockNumber,

      database: {
        saved: !!dbUser,
        id: dbUser?._id || null,
      },
    });
  } catch (error) {
    console.error(
      "Assign role error:",
      error
    );

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;