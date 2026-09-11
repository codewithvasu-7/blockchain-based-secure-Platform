import { ethers } from "ethers";
import { CONTRACTS } from "./addresses";

import { AUDIT_TRAIL_ABI, IDENTITY_ABI, RBAC_ABI, ASSET_NFT_ABI } from "./abis";

export const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

export const auditContract = new ethers.Contract(
  CONTRACTS.auditTrail,
  AUDIT_TRAIL_ABI,
  provider,
);

export const identityContract = new ethers.Contract(
  CONTRACTS.identity,
  IDENTITY_ABI,
  provider,
);

export const rbacContract = new ethers.Contract(
  CONTRACTS.rbac,
  RBAC_ABI,
  provider,
);

export const assetContract = new ethers.Contract(
  CONTRACTS.assetNFT,
  ASSET_NFT_ABI,
  provider,
);

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const browserProvider = new ethers.BrowserProvider(window.ethereum);

  await browserProvider.send("eth_requestAccounts", []);

  const signer = await browserProvider.getSigner();

  const address = await signer.getAddress();

  return {
    provider: browserProvider,
    signer,
    address,
  };
}
