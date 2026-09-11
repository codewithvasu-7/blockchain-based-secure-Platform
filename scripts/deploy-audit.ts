import { network } from "hardhat";

const { ethers } = await network.connect();

const auditTrail = await ethers.deployContract("AuditTrail");

await auditTrail.waitForDeployment();

console.log("AuditTrail Contract deployed to:");
console.log(await auditTrail.getAddress());