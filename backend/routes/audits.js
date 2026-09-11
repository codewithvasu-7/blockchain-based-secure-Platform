const express = require("express");

const {
  auditContract
} = require("../blockchain");

const {
  getErrorMessage
} = require("../utils/errors");

const router = express.Router();

const ACTION_NAMES = [
  "USER_CREATED",
  "ROLE_ASSIGNED",
  "ASSET_MINTED",
  "ASSET_TRANSFERRED",
  "PERMISSION_CHANGED"
];

// ============================================================
// GET ALL AUDITS
// GET /api/audits
// ============================================================

router.get("/", async (req, res) => {

  try {

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

        audits.push({

          id:
            Number(record[0]),

          action,

          actionName:
            ACTION_NAMES[action] ||
            "UNKNOWN",

          actor:
            record[2],

          targetId:
            record[3],

          details:
            record[4],

          timestamp,

          date:
            new Date(
              timestamp * 1000
            ).toISOString()

        });

      } catch {

        // Skip invalid audit

      }

    }

    audits.reverse();

    res.json({

      success: true,

      total:
        audits.length,

      audits

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
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
        error:
          "Invalid audit ID"
      });

    }

    const record =
      await auditContract.getAudit(id);

    const action =
      Number(record[1]);

    const timestamp =
      Number(record[5]);

    res.json({

      success: true,

      audit: {

        id:
          Number(record[0]),

        action,

        actionName:
          ACTION_NAMES[action] ||
          "UNKNOWN",

        actor:
          record[2],

        targetId:
          record[3],

        details:
          record[4],

        timestamp,

        date:
          new Date(
            timestamp * 1000
          ).toISOString()

      }

    });

  } catch (error) {

    res.status(404).json({

      success: false,

      error:
        getErrorMessage(error)

    });

  }

});

module.exports = router;