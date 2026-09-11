// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditTrail {

    enum Action {
        USER_CREATED,
        ROLE_ASSIGNED,
        ASSET_MINTED,
        ASSET_TRANSFERRED,
        PERMISSION_CHANGED
    }

    struct AuditRecord {
        uint256 id;
        Action action;
        address actor;
        string targetId;
        string details;
        uint256 timestamp;
    }

    uint256 private nextAuditId = 1;

    mapping(uint256 => AuditRecord) public auditRecords;

    event AuditRecorded(
        uint256 indexed id,
        Action action,
        address indexed actor,
        string targetId,
        string details,
        uint256 timestamp
    );

    function recordAudit(
        Action _action,
        string memory _targetId,
        string memory _details
    ) public {

        uint256 id = nextAuditId;

        auditRecords[id] = AuditRecord(
            id,
            _action,
            msg.sender,
            _targetId,
            _details,
            block.timestamp
        );

        nextAuditId++;

        emit AuditRecorded(
            id,
            _action,
            msg.sender,
            _targetId,
            _details,
            block.timestamp
        );
    }

    function getAudit(
        uint256 _id
    )
        public
        view
        returns (
            uint256,
            Action,
            address,
            string memory,
            string memory,
            uint256
        )
    {
        AuditRecord memory record = auditRecords[_id];

        return (
            record.id,
            record.action,
            record.actor,
            record.targetId,
            record.details,
            record.timestamp
        );
    }

    function getTotalAudits()
        public
        view
        returns (uint256)
    {
        return nextAuditId - 1;
    }
}