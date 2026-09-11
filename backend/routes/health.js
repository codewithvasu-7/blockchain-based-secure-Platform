const express = require("express");

const {
  provider,
  adminWallet
} = require("../blockchain");

const router = express.Router();

// GET /api/health

router.get("/", async (req, res) => {
  try {
    const network = await provider.getNetwork();

    const blockNumber =
      await provider.getBlockNumber();

    res.json({
      success: true,

      backend: {
        status: "running",
        port: 5000
      },

      blockchain: {
        connected: true,
        chainId: network.chainId.toString(),
        blockNumber,
        rpc: "http://127.0.0.1:8545"
      },

      adminWallet: adminWallet.address
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});

module.exports = router;