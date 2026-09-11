import { network } from "hardhat";

const { ethers } = await network.connect();

const auditAddress =
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

const auditTrail = await ethers.getContractAt(
    "AuditTrail",
    auditAddress
);

console.log("Recording audit event...");

const tx = await auditTrail.recordAudit(
    2, // ASSET_MINTED
    "LAP001",
    "Dell Laptop NFT minted"
);

await tx.wait();

console.log("Audit record created!");
console.log("Transaction hash:", tx.hash);