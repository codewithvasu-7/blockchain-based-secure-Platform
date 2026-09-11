import { network } from "hardhat";

const { ethers } = await network.connect();

const assetAddress =
    "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";

const assetNFT = await ethers.getContractAt(
    "AssetNFT",
    assetAddress
);

const signers = await ethers.getSigners();

// Rahul = Account #1
const rahul = signers[1];

console.log("Testing USER mint permission...");
console.log("Rahul:", await rahul.getAddress());

const role = await (
    await ethers.getContractAt(
        "RBAC",
        "0x9A676e781A523b5d0C0e43731313A708CB607508"
    )
).getRole(await rahul.getAddress());

console.log("Rahul Role:", role.toString());

try {

    const assetAsRahul =
        assetNFT.connect(rahul);

    await assetAsRahul.mintAsset(
        "HACK001",
        "Unauthorized Laptop",
        "Laptop",
        await rahul.getAddress()
    );

    console.log("❌ SECURITY FAILURE!");
    console.log("USER was able to mint an asset.");

} catch (error) {

    console.log("✅ SECURITY TEST PASSED!");
    console.log(
        "USER cannot mint assets."
    );
}