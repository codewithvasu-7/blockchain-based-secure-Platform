// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuditRBAC {

    enum Action {
        USER_CREATED,
        ROLE_ASSIGNED,
        ASSET_MINTED,
        ASSET_TRANSFERRED,
        PERMISSION_CHANGED
    }

    function recordAudit(
        Action _action,
        string memory _targetId,
        string memory _details
    ) external;
}

contract RBAC {

    enum Role {
        NONE,
        ADMIN,
        MANAGER,
        AUDITOR,
        USER
    }

    mapping(address => Role) private roles;

    address public owner;
    address public auditContract;

    event RoleAssigned(
        address indexed user,
        Role role
    );

    constructor(address _auditContract) {

        require(
            _auditContract != address(0),
            "Invalid Audit address"
        );

        owner = msg.sender;
        auditContract = _auditContract;

        roles[msg.sender] = Role.ADMIN;

        emit RoleAssigned(
            msg.sender,
            Role.ADMIN
        );
    }

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.ADMIN,
            "Only Admin can perform this action"
        );
        _;
    }

    function assignRole(
        address _user,
        Role _role
    ) public onlyAdmin {

        require(
            _user != address(0),
            "Invalid user address"
        );

        require(
            _role != Role.NONE,
            "Invalid role"
        );

        roles[_user] = _role;

        emit RoleAssigned(
            _user,
            _role
        );

        IAuditRBAC(auditContract).recordAudit(
            IAuditRBAC.Action.ROLE_ASSIGNED,
            _addressToString(_user),
            string.concat(
                "Role assigned: ",
                _roleName(_role)
            )
        );
    }

    function getRole(
        address _user
    ) public view returns (Role) {
        return roles[_user];
    }

    function isAdmin(
        address _user
    ) public view returns (bool) {
        return roles[_user] == Role.ADMIN;
    }

    function isManager(
        address _user
    ) public view returns (bool) {
        return roles[_user] == Role.MANAGER;
    }

    function isAuditor(
        address _user
    ) public view returns (bool) {
        return roles[_user] == Role.AUDITOR;
    }

    function isUser(
        address _user
    ) public view returns (bool) {
        return roles[_user] == Role.USER;
    }

    function _roleName(
        Role _role
    ) internal pure returns (string memory) {

        if (_role == Role.ADMIN) {
            return "ADMIN";
        }

        if (_role == Role.MANAGER) {
            return "MANAGER";
        }

        if (_role == Role.AUDITOR) {
            return "AUDITOR";
        }

        if (_role == Role.USER) {
            return "USER";
        }

        return "NONE";
    }

    function _addressToString(
        address _address
    )
        internal
        pure
        returns (string memory)
    {
        bytes32 value =
            bytes32(uint256(uint160(_address)));

        bytes memory alphabet =
            "0123456789abcdef";

        bytes memory str =
            new bytes(42);

        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 20; i++) {

            str[2 + i * 2] =
                alphabet[
                    uint8(value[i + 12] >> 4)
                ];

            str[3 + i * 2] =
                alphabet[
                    uint8(value[i + 12] & 0x0f)
                ];

            }

        return string(str);
    }
}