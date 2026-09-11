import { network } from "hardhat";

const { ethers } = await network.connect();

const auditAddress =
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

const auditTrail = await ethers.getContractAt(
    "AuditTrail",
    auditAddress
);

const total = await auditTrail.getTotalAudits();

console.log("========== AUDIT HISTORY ==========");
console.log("Total Audits:", total.toString());
console.log("");

for (let i = 1; i <= Number(total); i++) {

    const audit = await auditTrail.getAudit(i);

    let action = "";

    switch (Number(audit[1])) {
        case 0:
            action = "USER_CREATED";
            break;
        case 1:
            action = "ROLE_ASSIGNED";
            break;
        case 2:
            action = "ASSET_MINTED";
            break;
        case 3:
            action = "ASSET_TRANSFERRED";
            break;
        case 4:
            action = "PERMISSION_CHANGED";
            break;
        default:
            action = "UNKNOWN";
    }

    console.log("----------------------------------");
    console.log("Audit ID  :", audit[0].toString());
    console.log("Action    :", action);
    console.log("Actor     :", audit[2]);
    console.log("Target ID :", audit[3]);
    console.log("Details   :", audit[4]);
    console.log("Timestamp :", audit[5].toString());
}

console.log("----------------------------------");