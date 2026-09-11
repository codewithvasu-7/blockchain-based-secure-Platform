import { network } from "hardhat";

const { ethers } = await network.connect();

const assetAddress =
    "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";

const assetNFT = await ethers.getContractAt(
    "AssetNFT",
    assetAddress
);

const signers = await ethers.getSigners();

// Account #1 = Rahul
const owner = await signers[1].getAddress();

console.log("Creating integrated asset...");
console.log("Asset ID: LAP003");
console.log("Owner:", owner);

const tx = await assetNFT.mintAsset(
    "LAP003",
    "Dell Latitude 5440",
    "Laptop",
    owner
);

await tx.wait();

console.log("Asset created successfully!");
console.log("Transaction hash:", tx.hash);
console.log("Asset ID: LAP003");
console.log("Owner:", owner);