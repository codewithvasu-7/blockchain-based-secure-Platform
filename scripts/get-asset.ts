import { network } from "hardhat";

const { ethers } = await network.connect();

const assetAddress =
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

const assetNFT = await ethers.getContractAt(
    "AssetNFT",
    assetAddress
);

const asset = await assetNFT.getAsset(1);

console.log("========== ASSET DETAILS ==========");
console.log("Token ID   :", asset[0].toString());
console.log("Asset ID   :", asset[1]);
console.log("Asset Name :", asset[2]);
console.log("Asset Type :", asset[3]);
console.log("Owner      :", asset[4]);
console.log("Active     :", asset[5]);