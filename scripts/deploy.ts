import { network } from "hardhat";

const { ethers } = await network.connect();

const rbacAddress =
    "0x9A676e781A523b5d0C0e43731313A708CB607508";

const auditAddress =
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

console.log("Using RBAC address:", rbacAddress);
console.log("Using AuditTrail address:", auditAddress);

const Identity =
    await ethers.getContractFactory("Identity");

const identity =
    await Identity.deploy(
        rbacAddress,
        auditAddress
    );

await identity.waitForDeployment();

console.log("Identity Contract deployed to:");
console.log(await identity.getAddress());