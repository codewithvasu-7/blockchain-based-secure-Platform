const express = require("express");

const {
  auditContract,
} = require("../blockchain");

const {
  getErrorMessage,
} = require("../utils/errors");

const AuditLog = require("../models/AuditLog");

const router = express.Router();

// ============================================================
// ACTION NAMES
// ============================================================

const ACTION_NAMES = [
  "USER_CREATED",
  "ROLE_ASSIGNED",
  "ASSET_MINTED",
  "ASSET_TRANSFERRED",
  "PERMISSION_CHANGED",
];

// ============================================================
// GET ALL AUDITS
// GET /api/audits
// ============================================================

router.get("/", async (req, res) => {
  try {
    // ========================================================
    // BLOCKCHAIN = SOURCE OF TRUTH
    // ========================================================

    const total =
      await auditContract.getTotalAudits();

    const audits = [];

    for (
      let i = 1;
      i <= Number(total);
      i++
    ) {
      try {
        const record =
          await auditContract.getAudit(i);

        const action =
          Number(record[1]);

        const timestamp =
          Number(record[5]);

        const auditData = {
          id: Number(record[0]),

          action,

          actionName:
            ACTION_NAMES[action] ||
            "UNKNOWN",

          actor: record[2],

          targetId: record[3],

          details: record[4],

          timestamp,

          date: new Date(
            timestamp * 1000
          ).toISOString(),
        };

        audits.push(auditData);

        // ====================================================
        // SAVE / UPDATE AUDIT IN MONGODB
        // ====================================================

        await AuditLog.findOneAndUpdate(
          {
            blockchainId:
              auditData.id,
          },
          {
            blockchainId:
              auditData.id,

            action:
              auditData.action,

            actionName:
              auditData.actionName,

            actor:
              auditData.actor.toLowerCase(),

            targetId:
              auditData.targetId,

            details:
              auditData.details,

            timestamp:
              auditData.timestamp,

            date:
              new Date(
                timestamp * 1000
              ),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      } catch (error) {
        console.error(
          `Failed to process audit ${i}:`,
          error.message
        );

        // Skip invalid audit
      }
    }

    // Latest audit first
    audits.reverse();

    // ========================================================
    // RESPONSE
    // ========================================================

    res.json({
      success: true,

      total: audits.length,

      audits,

      database: {
        synced: true,
      },
    });
  } catch (error) {
    console.error(
      "Get audits error:",
      error
    );

    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// ============================================================
// GET SINGLE AUDIT
// GET /api/audits/:id
// ============================================================

router.get("/:id", async (req, res) => {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid audit ID",
      });
    }

    // ========================================================
    // BLOCKCHAIN = SOURCE OF TRUTH
    // ========================================================

    const record =
      await auditContract.getAudit(id);

    const action =
      Number(record[1]);

    const timestamp =
      Number(record[5]);

    const auditData = {
      id: Number(record[0]),

      action,

      actionName:
        ACTION_NAMES[action] ||
        "UNKNOWN",

      actor: record[2],

      targetId: record[3],

      details: record[4],

      timestamp,

      date: new Date(
        timestamp * 1000
      ).toISOString(),
    };

    // ========================================================
    // SYNC SINGLE AUDIT WITH MONGODB
    // ========================================================

    const dbAudit =
      await AuditLog.findOneAndUpdate(
        {
          blockchainId:
            auditData.id,
        },
        {
          blockchainId:
            auditData.id,

          action:
            auditData.action,

          actionName:
            auditData.actionName,

          actor:
            auditData.actor.toLowerCase(),

          targetId:
            auditData.targetId,

          details:
            auditData.details,

          timestamp:
            auditData.timestamp,

          date:
            auditData.date,
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

    res.json({
      success: true,

      audit: auditData,

      database: {
        saved: true,
        id: dbAudit._id,
      },
    });
  } catch (error) {
    console.error(
      "Get audit error:",
      error
    );

    res.status(404).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;