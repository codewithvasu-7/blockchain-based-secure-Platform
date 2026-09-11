// export const AUDIT_TRAIL_ABI = [
//   "function getTotalAudits() view returns (uint256)",
//   "function getAudit(uint256) view returns (uint256, uint8, address, string, string, uint256)",
// ];

// export const IDENTITY_ABI = [
//   "function getUser(address) view returns (string, string, bool)",
//   "function createUser(address,string,string)",
// ];

// export const RBAC_ABI = ["function getRole(address) view returns (uint8)"];

// export const ASSET_NFT_ABI = [
//   "function getOwnerAssets(address) view returns (uint256[])",
//   "function getAsset(uint256) view returns (uint256, string, string, string, address, bool)",
// ];
export const AUDIT_TRAIL_ABI = [
  "function getTotalAudits() view returns (uint256)",
  "function getAudit(uint256) view returns (uint256, uint8, address, string, string, uint256)",
];

export const IDENTITY_ABI = [
  "function getUser(address) view returns (string, string, bool)",
  "function createUser(address,string,string)",
];

export const RBAC_ABI = [
  "function getRole(address) view returns (uint8)",
  "function assignRole(address,uint8)",
];

export const ASSET_NFT_ABI = [
  "function getOwnerAssets(address) view returns (uint256[])",
  "function getAsset(uint256) view returns (uint256, string, string, string, address, bool)",
];
