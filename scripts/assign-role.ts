import { network } from "hardhat";

const { ethers } = await network.connect();

const rbacAddress =
    "0x9A676e781A523b5d0C0e43731313A708CB607508";

const rbac = await ethers.getContractAt(
    "RBAC",
    rbacAddress
);

const signers = await ethers.getSigners();

const userAddress =
    await signers[1].getAddress();

console.log("Assigning USER role...");
console.log("User:", userAddress);

const tx = await rbac.assignRole(
    userAddress,
    4
);

await tx.wait();

console.log("Role assigned successfully!");
console.log("Role: USER");
console.log("Transaction hash:", tx.hash);