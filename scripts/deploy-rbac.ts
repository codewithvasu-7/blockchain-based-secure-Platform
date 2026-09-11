import { network } from "hardhat";

const { ethers } = await network.connect();

const auditAddress =
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

console.log(
    "Using AuditTrail address:",
    auditAddress
);

const RBAC =
    await ethers.getContractFactory("RBAC");

const rbac =
    await RBAC.deploy(auditAddress);

await rbac.waitForDeployment();

console.log("RBAC Contract deployed to:");
console.log(await rbac.getAddress());