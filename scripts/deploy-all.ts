import hre from "hardhat";

async function main() {
  console.log("\nStarting deployment...\n");

  const { ethers } = await hre.network.connect();

  // 1. AuditTrail
  const AuditTrail = await ethers.getContractFactory("AuditTrail");
  const auditTrail = await AuditTrail.deploy();

  await auditTrail.waitForDeployment();

  const auditAddress = await auditTrail.getAddress();

  console.log("AuditTrail deployed to:");
  console.log(auditAddress);

  // 2. RBAC
  const RBAC = await ethers.getContractFactory("RBAC");
  const rbac = await RBAC.deploy(auditAddress);

  await rbac.waitForDeployment();

  const rbacAddress = await rbac.getAddress();

  console.log("\nRBAC deployed to:");
  console.log(rbacAddress);

  // 3. Identity
  const Identity = await ethers.getContractFactory("Identity");

  const identity = await Identity.deploy(
    rbacAddress,
    auditAddress
  );

  await identity.waitForDeployment();

  const identityAddress = await identity.getAddress();

  console.log("\nIdentity deployed to:");
  console.log(identityAddress);

  // 4. AssetNFT
  const AssetNFT = await ethers.getContractFactory("AssetNFT");

  const assetNFT = await AssetNFT.deploy(
    rbacAddress,
    auditAddress
  );

  await assetNFT.waitForDeployment();

  const assetAddress = await assetNFT.getAddress();

  console.log("\nAssetNFT deployed to:");
  console.log(assetAddress);

  console.log("\n================================");
  console.log("ALL CONTRACTS DEPLOYED");
  console.log("================================");

  console.log("AuditTrail:", auditAddress);
  console.log("RBAC:", rbacAddress);
  console.log("Identity:", identityAddress);
  console.log("AssetNFT:", assetAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});