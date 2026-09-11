const express = require("express");
const { ethers } = require("ethers");

const {
  identityContract,
  identityWrite
} = require("../blockchain");

const {
  getErrorMessage
} = require("../utils/errors");

const router = express.Router();

// ============================================================
// GET USER
// GET /api/users/:wallet
// ============================================================

router.get("/:wallet", async (req, res) => {

  try {

    const wallet = req.params.wallet;

    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address"
      });
    }

    const user =
      await identityContract.getUser(wallet);

    res.json({
      success: true,

      wallet,

      user: {
        name: user[0],
        did: user[1],
        active: user[2]
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
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
      did
    } = req.body;

    if (!ethers.isAddress(wallet)) {

      return res.status(400).json({
        success: false,
        error: "Invalid wallet address"
      });

    }

    if (!name || !name.trim()) {

      return res.status(400).json({
        success: false,
        error: "User name is required"
      });

    }

    if (!did || !did.trim()) {

      return res.status(400).json({
        success: false,
        error: "DID is required"
      });

    }

    const tx =
      await identityWrite.createUser(
        wallet,
        name.trim(),
        did.trim()
      );

    const receipt =
      await tx.wait();

    res.status(201).json({

      success: true,

      message:
        "User created successfully",

      transactionHash: tx.hash,

      blockNumber:
        receipt.blockNumber

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
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

      const wallet =
        req.params.wallet;

      if (!ethers.isAddress(wallet)) {

        return res.status(400).json({
          success: false,
          error: "Invalid wallet address"
        });

      }

      const tx =
        await identityWrite.deactivateUser(
          wallet
        );

      const receipt =
        await tx.wait();

      res.json({

        success: true,

        message:
          "User deactivated successfully",

        transactionHash:
          tx.hash,

        blockNumber:
          receipt.blockNumber

      });

    } catch (error) {

      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });

    }

  }
);

module.exports = router;