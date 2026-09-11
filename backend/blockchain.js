const { ethers } = require("ethers");
require("dotenv").config();

// ============================================================
// CONFIGURATION
// ============================================================

const RPC_URL =
  process.env.RPC_URL || "http://127.0.0.1:8545";

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Admin wallet
const adminWallet = new ethers.Wallet(
  process.env.ADMIN_PRIVATE_KEY,
  provider
);

// ============================================================
// CONTRACT ADDRESSES
// ============================================================

const CONTRACTS = {
  auditTrail: process.env.AUDIT_TRAIL,
  rbac: process.env.RBAC,
  identity: process.env.IDENTITY,
  assetNFT: process.env.ASSET_NFT,
};

// ============================================================
// ABIs
// ============================================================

const AUDIT_ABI = [
  "function getTotalAudits() view returns (uint256)",

  "function getAudit(uint256) view returns (uint256,uint8,address,string,string,uint256)"
];

const RBAC_ABI = [
  "function getRole(address) view returns (uint8)",

  "function assignRole(address,uint8)",

  "function isAdmin(address) view returns (bool)",

  "function isManager(address) view returns (bool)",

  "function isAuditor(address) view returns (bool)",

  "function isUser(address) view returns (bool)"
];

const IDENTITY_ABI = [
  "function getUser(address) view returns (string,string,bool)",

  "function createUser(address,string,string)",

  "function deactivateUser(address)"
];

const ASSET_ABI = [
  "function getAsset(uint256) view returns (uint256,string,string,string,address,bool)",

  "function getOwnerAssets(address) view returns (uint256[])",

  "function mintAsset(string,string,string,address) returns (uint256)",

  "function transferAsset(uint256,address)"
];

// ============================================================
// READ CONTRACTS
// ============================================================

const auditContract = new ethers.Contract(
  CONTRACTS.auditTrail,
  AUDIT_ABI,
  provider
);

const rbacContract = new ethers.Contract(
  CONTRACTS.rbac,
  RBAC_ABI,
  provider
);

const identityContract = new ethers.Contract(
  CONTRACTS.identity,
  IDENTITY_ABI,
  provider
);

const assetContract = new ethers.Contract(
  CONTRACTS.assetNFT,
  ASSET_ABI,
  provider
);

// ============================================================
// WRITE CONTRACTS
// ============================================================

const rbacWrite = new ethers.Contract(
  CONTRACTS.rbac,
  RBAC_ABI,
  adminWallet
);

const identityWrite = new ethers.Contract(
  CONTRACTS.identity,
  IDENTITY_ABI,
  adminWallet
);

const assetWrite = new ethers.Contract(
  CONTRACTS.assetNFT,
  ASSET_ABI,
  adminWallet
);

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  provider,
  adminWallet,

  CONTRACTS,

  auditContract,
  rbacContract,
  identityContract,
  assetContract,

  rbacWrite,
  identityWrite,
  assetWrite
};