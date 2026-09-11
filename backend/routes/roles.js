const express = require("express");
const { ethers } = require("ethers");

const {
  rbacContract,
  rbacWrite
} = require("../blockchain");

const {
  getErrorMessage
} = require("../utils/errors");

const router = express.Router();

const ROLE_NAMES = [
  "NONE",
  "ADMIN",
  "MANAGER",
  "AUDITOR",
  "USER"
];

// ============================================================
// GET ROLE
// GET /api/roles/:wallet
// ============================================================

router.get("/:wallet", async (req, res) => {

  try {

    const wallet =
      req.params.wallet;

    if (!ethers.isAddress(wallet)) {

      return res.status(400).json({
        success: false,
        error: "Invalid wallet address"
      });

    }

    const role =
      await rbacContract.getRole(wallet);

    const roleNumber =
      Number(role);

    res.json({

      success: true,

      wallet,

      role: {
        id: roleNumber,
        name:
          ROLE_NAMES[roleNumber] ||
          "UNKNOWN"
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
// ASSIGN ROLE
// POST /api/roles
// ============================================================

router.post("/", async (req, res) => {

  try {

    const {
      wallet,
      role
    } = req.body;

    if (!ethers.isAddress(wallet)) {

      return res.status(400).json({
        success: false,
        error: "Invalid wallet address"
      });

    }

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
          "Role must be between 1 and 4"
      });

    }

    const tx =
      await rbacWrite.assignRole(
        wallet,
        roleNumber
      );

    const receipt =
      await tx.wait();

    res.json({

      success: true,

      message:
        `${ROLE_NAMES[roleNumber]} role assigned successfully`,

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

});

module.exports = router;