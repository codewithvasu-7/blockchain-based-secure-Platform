import { network } from "hardhat";

const { ethers } = await network.connect();

const assetAddress =
    "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";

const assetNFT = await ethers.getContractAt(
    "AssetNFT",
    assetAddress
);

const signers = await ethers.getSigners();

// Account #1 = Rahul/current owner
const currentOwner = signers[1];

// Account #2 = new owner
const newOwner = await signers[2].getAddress();

console.log("Transferring LAP003...");
console.log(
    "From:",
    await currentOwner.getAddress()
);
console.log("To  :", newOwner);

const assetNFTAsOwner =
    assetNFT.connect(currentOwner);

const tx =
    await assetNFTAsOwner.transferAsset(
        1,
        newOwner
    );

await tx.wait();

console.log("Transfer successful!");
console.log("Transaction hash:", tx.hash);
console.log("New owner:", newOwner);