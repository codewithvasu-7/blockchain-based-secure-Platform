const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Routes

const healthRouter = require("./routes/health");

const usersRouter = require("./routes/users");

const rolesRouter = require("./routes/roles");

const assetsRouter = require("./routes/assets");

const auditsRouter = require("./routes/audits");

const connectDatabase = require("./database");

// ============================================================
// APP
// ============================================================

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

// ============================================================
// ROOT
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    message: "BEL Blockchain Backend API",

    version: "1.0.0",

    status: "running",
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/health", healthRouter);

app.use("/api/users", usersRouter);

app.use("/api/roles", rolesRouter);

app.use("/api/assets", assetsRouter);

app.use("/api/audits", auditsRouter);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,

    error: "API endpoint not found",

    path: req.originalUrl,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,

    error: "Internal server error",
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log("");
      console.log("==========================================");
      console.log(" BEL BLOCKCHAIN BACKEND");
      console.log("==========================================");
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log("Blockchain: Hardhat Localhost");
      console.log("Chain ID: 31337");
      console.log("==========================================");
      console.log("");
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
