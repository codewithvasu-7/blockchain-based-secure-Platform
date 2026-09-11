import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const rbacAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const auditAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  console.log("Deploying new AssetNFT...");

  const AssetNFT = await ethers.getContractFactory("AssetNFT");

  const assetNFT = await AssetNFT.deploy(
    rbacAddress,
    auditAddress
  );

  await assetNFT.waitForDeployment();

  const assetAddress = await assetNFT.getAddress();

  console.log("\n================================");
  console.log("NEW ASSETNFT DEPLOYED");
  console.log("================================");
  console.log("AssetNFT:", assetAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});