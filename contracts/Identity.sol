// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRBACIdentity {
    function isAdmin(address _user) external view returns (bool);
}

interface IAuditIdentity {

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

contract Identity {

    struct User {
        string name;
        string did;
        bool active;
    }

    mapping(address => User) public users;

    address public rbacContract;
    address public auditContract;

    event UserCreated(
        address indexed wallet,
        string name,
        string did
    );

    constructor(
        address _rbacContract,
        address _auditContract
    ) {
        require(
            _rbacContract != address(0),
            "Invalid RBAC address"
        );

        require(
            _auditContract != address(0),
            "Invalid Audit address"
        );

        rbacContract = _rbacContract;
        auditContract = _auditContract;
    }

    modifier onlyAdmin() {
        require(
            IRBACIdentity(rbacContract).isAdmin(msg.sender),
            "Only Admin can create users"
        );
        _;
    }

    function createUser(
        address _wallet,
        string memory _name,
        string memory _did
    ) public onlyAdmin {

        require(
            _wallet != address(0),
            "Invalid wallet"
        );

        require(
            bytes(users[_wallet].did).length == 0,
            "User already exists"
        );

        users[_wallet] = User(
            _name,
            _did,
            true
        );

        emit UserCreated(
            _wallet,
            _name,
            _did
        );

        IAuditIdentity(auditContract).recordAudit(
            IAuditIdentity.Action.USER_CREATED,
            _did,
            string.concat(
                "User created: ",
                _name
            )
        );
    }

    function deactivateUser(
        address _wallet
    ) public onlyAdmin {

        require(
            bytes(users[_wallet].did).length != 0,
            "User does not exist"
        );

        users[_wallet].active = false;

        IAuditIdentity(auditContract).recordAudit(
            IAuditIdentity.Action.PERMISSION_CHANGED,
            users[_wallet].did,
            "User deactivated"
        );
    }

    function getUser(
        address _wallet
    )
        public
        view
        returns (
            string memory,
            string memory,
            bool
        )
    {
        User memory user = users[_wallet];

        return (
            user.name,
            user.did,
            user.active
        );
    }
}