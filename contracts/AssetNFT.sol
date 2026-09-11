// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRBAC {
    function isAdmin(address _user) external view returns (bool);
}

interface IAuditTrail {
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

contract AssetNFT {

    struct Asset {
        uint256 tokenId;
        string assetId;
        string assetName;
        string assetType;
        address owner;
        bool active;
    }

    uint256 private nextTokenId = 1;

    address public rbacContract;
    address public auditContract;

    mapping(uint256 => Asset) public assets;

    mapping(address => uint256[]) private ownerAssets;

    event AssetMinted(
        uint256 indexed tokenId,
        string assetId,
        string assetName,
        address indexed owner
    );

    event AssetTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
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

    // Only Admin can perform protected asset operations
    modifier onlyAdmin() {
        require(
            IRBAC(rbacContract).isAdmin(msg.sender),
            "Only Admin can perform this action"
        );
        _;
    }

    // =========================
    // MINT ASSET
    // =========================

    function mintAsset(
        string memory _assetId,
        string memory _assetName,
        string memory _assetType,
        address _owner
    )
        public
        onlyAdmin
        returns (uint256)
    {
        require(
            _owner != address(0),
            "Invalid owner"
        );

        uint256 tokenId = nextTokenId;

        assets[tokenId] = Asset(
            tokenId,
            _assetId,
            _assetName,
            _assetType,
            _owner,
            true
        );

        ownerAssets[_owner].push(tokenId);

        nextTokenId++;

        emit AssetMinted(
            tokenId,
            _assetId,
            _assetName,
            _owner
        );

        // Automatic audit record
        IAuditTrail(auditContract).recordAudit(
            IAuditTrail.Action.ASSET_MINTED,
            _assetId,
            string.concat(
                "Asset minted: ",
                _assetName
            )
        );

        return tokenId;
    }

    // =========================
    // ADMIN-ONLY TRANSFER
    // =========================

    function transferAsset(
        uint256 _tokenId,
        address _newOwner
    )
        public
        onlyAdmin
    {
        require(
            assets[_tokenId].active,
            "Asset does not exist"
        );

        require(
            _newOwner != address(0),
            "Invalid new owner"
        );

        address oldOwner = assets[_tokenId].owner;

        assets[_tokenId].owner = _newOwner;

        ownerAssets[_newOwner].push(_tokenId);

        emit AssetTransferred(
            _tokenId,
            oldOwner,
            _newOwner
        );

        // Automatic audit record
        IAuditTrail(auditContract).recordAudit(
            IAuditTrail.Action.ASSET_TRANSFERRED,
            assets[_tokenId].assetId,
            string.concat(
                "Asset transferred from ",
                _addressToString(oldOwner),
                " to ",
                _addressToString(_newOwner)
            )
        );
    }

    // =========================
    // GET ASSET
    // =========================

    function getAsset(
        uint256 _tokenId
    )
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            address,
            bool
        )
    {
        Asset memory asset = assets[_tokenId];

        return (
            asset.tokenId,
            asset.assetId,
            asset.assetName,
            asset.assetType,
            asset.owner,
            asset.active
        );
    }

    // =========================
    // GET OWNER ASSETS
    // =========================

    function getOwnerAssets(
        address _owner
    )
        public
        view
        returns (uint256[] memory)
    {
        return ownerAssets[_owner];
    }

    // =========================
    // ADDRESS TO STRING
    // =========================

    function _addressToString(
        address _address
    )
        internal
        pure
        returns (string memory)
    {
        bytes32 value = bytes32(
            uint256(uint160(_address))
        );

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