import { network } from "hardhat";

const { ethers } = await network.connect();

const identityAddress =
    "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

const rbacAddress =
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const identity = await ethers.getContractAt(
    "Identity",
    identityAddress
);

const rbac = await ethers.getContractAt(
    "RBAC",
    rbacAddress
);

const signers = await ethers.getSigners();

const userAddress =
    await signers[1].getAddress();

const user = await identity.getUser(
    userAddress
);

const role = await rbac.getRole(
    userAddress
);

let roleName = "";

switch (Number(role)) {
    case 0:
        roleName = "NONE";
        break;
    case 1:
        roleName = "ADMIN";
        break;
    case 2:
        roleName = "MANAGER";
        break;
    case 3:
        roleName = "AUDITOR";
        break;
    case 4:
        roleName = "USER";
        break;
    default:
        roleName = "UNKNOWN";
}

console.log("========== USER DETAILS ==========");
console.log("Wallet :", userAddress);
console.log("Name   :", user[0]);
console.log("DID    :", user[1]);
console.log("Active :", user[2]);
console.log("Role   :", roleName);
console.log("==================================");