import { network } from "hardhat";

const { ethers } = await network.connect();

const assetAddress =
    "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const assetNFT = await ethers.getContractAt(
    "AssetNFT",
    assetAddress
);

const signers = await ethers.getSigners();

// Account #2 = current owner of Token #1
const actualOwner = signers[2];

// Account #3 = unauthorized user
const attacker = signers[3];

const ownerAddress =
    await actualOwner.getAddress();

const attackerAddress =
    await attacker.getAddress();

console.log("");
console.log("==========================================");
console.log(" UNAUTHORIZED TRANSFER SECURITY TEST");
console.log("==========================================");

console.log("Asset Contract:", assetAddress);
console.log("Token ID:", 1);
console.log("Actual Owner:", ownerAddress);
console.log("Unauthorized User:", attackerAddress);

console.log("");
console.log("Attempting transfer as unauthorized user...");

try {
    const assetAsAttacker =
        assetNFT.connect(attacker);

    const tx =
        await assetAsAttacker.transferAsset(
            1,
            attackerAddress
        );

    await tx.wait();

    console.log("");
    console.log("❌ SECURITY FAILURE!");
    console.log(
        "Unauthorized user transferred the asset."
    );

} catch (error) {

    console.log("");
    console.log("✅ SECURITY TEST PASSED!");
    console.log(
        "Unauthorized user cannot transfer the asset."
    );

    console.log("");
    console.log(
        "Expected contract rule: Only Admin can perform this action"
    );
}

console.log("");
console.log("==========================================");