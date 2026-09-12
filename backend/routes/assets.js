const express = require("express");
const { ethers } = require("ethers");

const {
  assetContract,
  assetWrite,
} = require("../blockchain");

const {
  getErrorMessage,
} = require("../utils/errors");

const Asset = require("../models/Asset");

const router = express.Router();

// ============================================================
// ASSET EVENT INTERFACE
// Used to reliably decode AssetMinted event
// ============================================================

const assetEventInterface = new ethers.Interface([
  "event AssetMinted(uint256 indexed tokenId,string assetId,string assetName,address indexed owner)",
  "event AssetTransferred(uint256 indexed tokenId,address indexed from,address indexed to)",
]);

// ============================================================
// GET SINGLE ASSET
// GET /api/assets/:tokenId
// ============================================================

router.get("/:tokenId", async (req, res) => {
  try {
    const tokenId = Number(req.params.tokenId);

    if (
      !Number.isInteger(tokenId) ||
      tokenId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid Token ID",
      });
    }

    // ========================================================
    // BLOCKCHAIN = SOURCE OF TRUTH
    // ========================================================

    const asset =
      await assetContract.getAsset(tokenId);

    if (
      Number(asset[0]) === 0 ||
      !asset[5]
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found",
      });
    }

    const assetData = {
      tokenId: Number(asset[0]),
      assetId: asset[1],
      assetName: asset[2],
      assetType: asset[3],
      owner: asset[4],
      active: asset[5],
    };

    // ========================================================
    // SYNC ASSET WITH MONGODB
    // ========================================================

    const dbAsset =
      await Asset.findOneAndUpdate(
        {
          tokenId,
        },
        {
          tokenId: assetData.tokenId,
          assetId: assetData.assetId,
          assetName: assetData.assetName,
          assetType: assetData.assetType,
          owner: assetData.owner.toLowerCase(),
          active: assetData.active,
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

      asset: assetData,

      database: {
        saved: true,
        id: dbAsset._id,
      },
    });
  } catch (error) {
    console.error(
      "Get asset error:",
      error
    );

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
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

      // ======================================================
      // VALIDATE WALLET
      // ======================================================

      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid wallet address",
        });
      }

      // ======================================================
      // BLOCKCHAIN = SOURCE OF TRUTH
      // ======================================================

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

          // ==================================================
          // VERIFY CURRENT OWNER
          // ==================================================

          if (
            Number(asset[0]) > 0 &&
            asset[5] &&
            asset[4].toLowerCase() ===
              wallet.toLowerCase()
          ) {
            const assetData = {
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
                asset[5],
            };

            assets.push(assetData);

            // ================================================
            // SYNC WITH MONGODB
            // ================================================

            await Asset.findOneAndUpdate(
              {
                tokenId:
                  assetData.tokenId,
              },
              {
                tokenId:
                  assetData.tokenId,

                assetId:
                  assetData.assetId,

                assetName:
                  assetData.assetName,

                assetType:
                  assetData.assetType,

                owner:
                  assetData.owner.toLowerCase(),

                active:
                  assetData.active,
              },
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
              }
            );
          }
        } catch (error) {
          // Ignore stale or invalid token IDs
          console.log(
            `Skipping token ${tokenId}:`,
            error.message
          );
        }
      }

      // ======================================================
      // RESPONSE
      // ======================================================

      res.json({
        success: true,

        wallet,

        assets,

        database: {
          synced: true,
        },
      });
    } catch (error) {
      console.error(
        "Get owner assets error:",
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
// MINT ASSET
// POST /api/assets
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      assetId,
      assetName,
      assetType,
      owner,
    } = req.body || {};

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !assetId ||
      !assetId.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Asset ID is required",
      });
    }

    if (
      !assetName ||
      !assetName.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Asset Name is required",
      });
    }

    if (
      !assetType ||
      !assetType.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Asset Type is required",
      });
    }

    if (!ethers.isAddress(owner)) {
      return res.status(400).json({
        success: false,
        error: "Invalid owner wallet",
      });
    }

    // ========================================================
    // OPTIONAL DUPLICATE CHECK IN MONGODB
    // ========================================================

    const existingAsset =
      await Asset.findOne({
        assetId: assetId.trim(),
      });

    if (existingAsset) {
      return res.status(409).json({
        success: false,
        error:
          "Asset with this Asset ID already exists",
        asset: {
          tokenId:
            existingAsset.tokenId,
          assetId:
            existingAsset.assetId,
        },
      });
    }

    // ========================================================
    // 1. MINT ON BLOCKCHAIN
    // ========================================================

    const tx =
      await assetWrite.mintAsset(
        assetId.trim(),
        assetName.trim(),
        assetType.trim(),
        owner
      );

    console.log(
      "Asset mint transaction:",
      tx.hash
    );

    // ========================================================
    // WAIT FOR BLOCKCHAIN CONFIRMATION
    // ========================================================

    const receipt =
      await tx.wait();

    console.log(
      "Asset mint confirmed in block:",
      receipt.blockNumber
    );

    // ========================================================
    // 2. FIND AssetMinted EVENT
    // ========================================================

    let mintedLog = null;

    for (const log of receipt.logs) {
      try {
        const parsed =
          assetEventInterface.parseLog({
            topics: log.topics,
            data: log.data,
          });

        if (
          parsed &&
          parsed.name === "AssetMinted"
        ) {
          mintedLog = parsed;
          break;
        }
      } catch {
        // Ignore logs from other contracts
      }
    }

    // ========================================================
    // EVENT NOT FOUND FALLBACK
    // ========================================================

    if (!mintedLog) {
      console.error(
        "AssetMinted event was not found."
      );

      console.error(
        "Transaction hash:",
        tx.hash
      );

      console.error(
        "Receipt logs:",
        receipt.logs
      );

      return res.status(500).json({
        success: false,

        error:
          "Asset was minted on blockchain, but AssetMinted event could not be decoded",

        transactionHash:
          tx.hash,

        blockNumber:
          receipt.blockNumber,
      });
    }

    // ========================================================
    // GET TOKEN ID
    // ========================================================

    const tokenId =
      Number(
        mintedLog.args.tokenId
      );

    // ========================================================
    // GET EVENT DATA
    // ========================================================

    const mintedAssetId =
      mintedLog.args.assetId;

    const mintedAssetName =
      mintedLog.args.assetName;

    const mintedOwner =
      mintedLog.args.owner;

    // ========================================================
    // 3. SAVE ASSET IN MONGODB
    // ========================================================

    const dbAsset =
      await Asset.findOneAndUpdate(
        {
          tokenId,
        },
        {
          tokenId,

          assetId:
            mintedAssetId,

          assetName:
            mintedAssetName,

          assetType:
            assetType.trim(),

          owner:
            mintedOwner.toLowerCase(),

          active: true,

          transactionHash:
            tx.hash,

          blockNumber:
            receipt.blockNumber,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    res.status(201).json({
      success: true,

      message:
        "Digital asset minted successfully",

      tokenId,

      asset: {
        assetId:
          mintedAssetId,

        assetName:
          mintedAssetName,

        assetType:
          assetType.trim(),

        owner:
          mintedOwner,
      },

      transactionHash:
        tx.hash,

      blockNumber:
        receipt.blockNumber,

      database: {
        saved: true,
        id: dbAsset._id,
      },
    });
  } catch (error) {
    console.error(
      "Mint asset error:",
      error
    );

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
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
        newOwner,
      } = req.body || {};

      // ======================================================
      // VALIDATE TOKEN ID
      // ======================================================

      if (
        !Number.isInteger(tokenId) ||
        tokenId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid Token ID",
        });
      }

      // ======================================================
      // VALIDATE NEW OWNER
      // ======================================================

      if (
        !ethers.isAddress(newOwner)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid new owner address",
        });
      }

      // ======================================================
      // CHECK ASSET ON BLOCKCHAIN
      // ======================================================

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
            "Asset not found or inactive",
        });
      }

      const oldOwner =
        asset[4];

      // ======================================================
      // 1. TRANSFER ON BLOCKCHAIN
      // ======================================================

      const tx =
        await assetWrite.transferAsset(
          tokenId,
          newOwner
        );

      console.log(
        "Asset transfer transaction:",
        tx.hash
      );

      // ======================================================
      // WAIT FOR CONFIRMATION
      // ======================================================

      const receipt =
        await tx.wait();

      console.log(
        "Asset transfer confirmed in block:",
        receipt.blockNumber
      );

      // ======================================================
      // 2. UPDATE MONGODB
      // ======================================================

      const dbAsset =
        await Asset.findOneAndUpdate(
          {
            tokenId,
          },
          {
            owner:
              newOwner.toLowerCase(),

            transactionHash:
              tx.hash,

            blockNumber:
              receipt.blockNumber,
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

        message:
          "Asset transferred successfully",

        tokenId,

        previousOwner:
          oldOwner,

        newOwner:
          newOwner.toLowerCase(),

        transactionHash:
          tx.hash,

        blockNumber:
          receipt.blockNumber,

        database: {
          saved: !!dbAsset,

          id:
            dbAsset?._id ||
            null,
        },
      });
    } catch (error) {
      console.error(
        "Transfer asset error:",
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