import { network } from "hardhat";

const { ethers } = await network.connect();

const identityAddress =
    "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

const identity = await ethers.getContractAt(
    "Identity",
    identityAddress
);

const signers = await ethers.getSigners();

const userWallet =
    await signers[1].getAddress();

console.log("Creating user...");
console.log("Wallet:", userWallet);

const tx = await identity.createUser(
    userWallet,
    "Rahul",
    "did:bel:rahul001"
);

await tx.wait();

console.log("User created successfully!");
console.log("Name:", "Rahul");
console.log("DID:", "did:bel:rahul001");
console.log("Wallet:", userWallet);
console.log("Transaction hash:", tx.hash);