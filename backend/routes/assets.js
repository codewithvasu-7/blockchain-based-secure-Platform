const express = require("express");
const { ethers } = require("ethers");

const {
  assetContract,
  assetWrite
} = require("../blockchain");

const {
  getErrorMessage
} = require("../utils/errors");

const router = express.Router();

// ============================================================
// GET SINGLE ASSET
// GET /api/assets/:tokenId
// ============================================================

router.get("/:tokenId", async (req, res) => {

  try {

    const tokenId =
      Number(req.params.tokenId);

    if (
      !Number.isInteger(tokenId) ||
      tokenId <= 0
    ) {

      return res.status(400).json({
        success: false,
        error: "Invalid Token ID"
      });

    }

    const asset =
      await assetContract.getAsset(
        tokenId
      );

    if (
      Number(asset[0]) === 0 ||
      !asset[5]
    ) {

      return res.status(404).json({
        success: false,
        error: "Asset not found"
      });

    }

    res.json({

      success: true,

      asset: {

        tokenId:
          Number(asset[0]),

        assetId:
          asset[1],

        assetName:
          asset[2],

        assetType:
          asset[3],

        owner:
          asset[4],

        active:
          asset[5]

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
// OWNER ASSETS
// GET /api/assets/owner/:wallet
// ============================================================

router.get(
  "/owner/:wallet",
  async (req, res) => {

    try {

      const wallet =
        req.params.wallet;

      if (!ethers.isAddress(wallet)) {

        return res.status(400).json({
          success: false,
          error:
            "Invalid wallet address"
        });

      }

      const tokenIds =
        await assetContract.getOwnerAssets(
          wallet
        );

      const assets = [];

      for (const tokenId of tokenIds) {

        try {

          const asset =
            await assetContract.getAsset(
              tokenId
            );

          if (
            Number(asset[0]) > 0 &&
            asset[5]
          ) {

            assets.push({

              tokenId:
                Number(asset[0]),

              assetId:
                asset[1],

              assetName:
                asset[2],

              assetType:
                asset[3],

              owner:
                asset[4],

              active:
                asset[5]

            });

          }

        } catch {

          // Ignore stale token IDs

        }

      }

      res.json({

        success: true,

        wallet,

        assets

      });

    } catch (error) {

      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });

    }

  }
);

// ============================================================
// MINT ASSET
// POST /api/assets
// ============================================================

router.post("/", async (req, res) => {

  try {

    const {
      assetId,
      assetName,
      assetType,
      owner
    } = req.body;

    if (!assetId || !assetId.trim()) {

      return res.status(400).json({
        success: false,
        error: "Asset ID is required"
      });

    }

    if (!assetName || !assetName.trim()) {

      return res.status(400).json({
        success: false,
        error: "Asset Name is required"
      });

    }

    if (!assetType || !assetType.trim()) {

      return res.status(400).json({
        success: false,
        error: "Asset Type is required"
      });

    }

    if (!ethers.isAddress(owner)) {

      return res.status(400).json({
        success: false,
        error:
          "Invalid owner wallet"
      });

    }

    const tx =
      await assetWrite.mintAsset(

        assetId.trim(),

        assetName.trim(),

        assetType.trim(),

        owner

      );

    const receipt =
      await tx.wait();

    res.status(201).json({

      success: true,

      message:
        "Digital asset minted successfully",

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

// ============================================================
// TRANSFER ASSET
// POST /api/assets/:tokenId/transfer
// ============================================================

router.post(
  "/:tokenId/transfer",
  async (req, res) => {

    try {

      const tokenId =
        Number(req.params.tokenId);

      const {
        newOwner
      } = req.body;

      if (
        !Number.isInteger(tokenId) ||
        tokenId <= 0
      ) {

        return res.status(400).json({
          success: false,
          error: "Invalid Token ID"
        });

      }

      if (!ethers.isAddress(newOwner)) {

        return res.status(400).json({
          success: false,
          error:
            "Invalid new owner address"
        });

      }

      const asset =
        await assetContract.getAsset(
          tokenId
        );

      if (
        Number(asset[0]) === 0 ||
        !asset[5]
      ) {

        return res.status(404).json({
          success: false,
          error:
            "Asset not found or inactive"
        });

      }

      const tx =
        await assetWrite.transferAsset(
          tokenId,
          newOwner
        );

      const receipt =
        await tx.wait();

      res.json({

        success: true,

        message:
          "Asset transferred successfully",

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