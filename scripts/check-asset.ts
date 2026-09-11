import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const assetAddress =
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

  const asset = new ethers.Contract(
    assetAddress,
    [
      "function getAsset(uint256) view returns (uint256,string,string,string,address,bool)"
    ],
    ethers.provider
  );

  console.log("Checking AssetNFT:");
  console.log(assetAddress);

  const result = await asset.getAsset(1);

  console.log("\nToken ID:", result[0].toString());
  console.log("Asset ID:", result[1]);
  console.log("Asset Name:", result[2]);
  console.log("Asset Type:", result[3]);
  console.log("Owner:", result[4]);
  console.log("Active:", result[5]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});