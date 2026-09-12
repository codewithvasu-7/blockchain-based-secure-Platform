import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  getHealth,
  getUser,
  createUser,
  assignRole,
  getAsset,
  mintAsset,
  transferAsset,
  getAudits,
} from "./api/backend";

import "./App.css";

import {
  auditContract,
  identityContract,
  rbacContract,
  assetContract,
  connectWallet,
} from "./contracts/blockchain";

import { CONTRACTS } from "./contracts/addresses";

// ============================================================
// TYPES
// ============================================================

type Tab = "dashboard" | "users" | "assets" | "roles" | "audit";

type AuditRecord = {
  id: number;
  action: number;
  actor: string;
  targetId: string;
  details: string;
  timestamp: number;
};

type AssetRecord = {
  tokenId: number;
  assetId: string;
  assetName: string;
  assetType: string;
  owner: string;
  active: boolean;
};

type UserRecord = {
  did: string;
  name: string;
  actor: string;
  timestamp: number;
};

type RoleRecord = {
  wallet: string;
  role: string;
  actor: string;
  timestamp: number;
};

type BackendAudit = {
  id: unknown;
  action: unknown;
  actor: string;
  targetId: string;
  details: string;
  timestamp: unknown;
};

// ============================================================
// CONSTANTS
// ============================================================

const ROLE_NAMES = ["NONE", "ADMIN", "MANAGER", "AUDITOR", "USER"];

const ACTION_NAMES = [
  "USER_CREATED",
  "ROLE_ASSIGNED",
  "ASSET_MINTED",
  "ASSET_TRANSFERRED",
  "PERMISSION_CHANGED",
];

const ADMIN_ROLE = 1;

// ============================================================
// APP
// ============================================================

function App() {
  // ==========================================================
  // GENERAL
  // ==========================================================

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const [loading, setLoading] = useState(false);

  const [blockchainConnected, setBlockchainConnected] = useState(false);

  const [backendStatus, setBackendStatus] = useState("Checking...");

  const [chainId, setChainId] = useState("");

  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  const [lastRefresh, setLastRefresh] = useState("");

  // ==========================================================
  // WALLET
  // ==========================================================

  const [walletAddress, setWalletAddress] = useState("");

  const [connectedRole, setConnectedRole] = useState("NONE");

  // ==========================================================
  // CURRENT IDENTITY
  // ==========================================================

  const [userName, setUserName] = useState("");

  const [userDid, setUserDid] = useState("");

  const [userActive, setUserActive] = useState(false);

  // ==========================================================
  // DATA
  // ==========================================================

  const [audits, setAudits] = useState<AuditRecord[]>([]);

  const [assets, setAssets] = useState<AssetRecord[]>([]);

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [roles, setRoles] = useState<RoleRecord[]>([]);

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const [newUserWallet, setNewUserWallet] = useState("");

  const [newUserName, setNewUserName] = useState("");

  const [newUserDid, setNewUserDid] = useState("");

  const [transactionStatus, setTransactionStatus] = useState("");

  // ==========================================================
  // ASSIGN ROLE
  // ==========================================================

  const [roleWallet, setRoleWallet] = useState("");

  const [selectedRole, setSelectedRole] = useState("4");

  const [roleStatus, setRoleStatus] = useState("");

  // ==========================================================
  // MINT ASSET
  // ==========================================================

  const [assetId, setAssetId] = useState("");

  const [assetName, setAssetName] = useState("");

  const [assetType, setAssetType] = useState("");

  const [assetOwner, setAssetOwner] = useState("");

  const [assetStatus, setAssetStatus] = useState("");

  // ==========================================================
  // TRANSFER ASSET
  // ==========================================================

  const [transferTokenId, setTransferTokenId] = useState("");

  const [transferNewOwner, setTransferNewOwner] = useState("");

  const [transferStatus, setTransferStatus] = useState("");

  // ==========================================================
  // ASSET SEARCH
  // ==========================================================

  const [searchTokenId, setSearchTokenId] = useState("");

  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);

  const [assetSearchStatus, setAssetSearchStatus] = useState("");

  // ==========================================================
  // AUDIT FILTER
  // ==========================================================

  const [auditFilter, setAuditFilter] = useState("ALL");

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadBlockchainData();
    // Initial data load intentionally runs once when the app mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // BACKEND HEALTH CHECK
  // ==========================================================

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await getHealth();

        if (data.success) {
          setBackendStatus("Connected");

          setBlockchainConnected(Boolean(data.blockchain.connected));

          setChainId(String(data.blockchain.chainId));

          setBlockNumber(Number(data.blockchain.blockNumber));
        }
      } catch (error) {
        console.error("Backend connection failed:", error);

        setBackendStatus("Disconnected");

        setBlockchainConnected(false);
      }
    }

    checkBackend();

    const interval = window.setInterval(checkBackend, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  // ==========================================================
  // METAMASK ACCOUNT CHANGE
  // ==========================================================

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWalletAddress("");
        setConnectedRole("NONE");
        setUserName("");
        setUserDid("");
        setUserActive(false);
        return;
      }

      try {
        await updateConnectedWallet(accounts[0]);
      } catch (error) {
        console.error("Account change error:", error);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
      }
    };
  }, []);

  // ==========================================================
  // METAMASK CHAIN CHANGE
  // ==========================================================

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // ==========================================================
  // UPDATE CONNECTED WALLET
  // ==========================================================

  async function updateConnectedWallet(address: string) {
    try {
      setWalletAddress(address);

      // ------------------------------------------------------
      // ROLE
      // ------------------------------------------------------

      const role = await rbacContract.getRole(address);

      const roleName = ROLE_NAMES[Number(role)] ?? "UNKNOWN";

      setConnectedRole(roleName);

      // ------------------------------------------------------
      // USER IDENTITY
      // ------------------------------------------------------

      try {
        const result = await getUser(address);

        if (result.success && result.user) {
          setUserName(result.user.name || "");

          setUserDid(result.user.did || "");

          setUserActive(Boolean(result.user.active));
        }
      } catch {
        // Fallback to blockchain
        const user = await identityContract.getUser(address);

        setUserName(user[0] || "");
        setUserDid(user[1] || "");
        setUserActive(Boolean(user[2]));
      }

      setBlockchainConnected(true);
    } catch (error) {
      console.error("Wallet data error:", error);

      setConnectedRole("NONE");
    }
  }

  // ==========================================================
  // LOAD BLOCKCHAIN DATA
  // ==========================================================

  async function loadBlockchainData() {
    try {
      setLoading(true);

      // ======================================================
      // AUDITS
      // ======================================================

      let auditRecords: AuditRecord[] = [];

      try {
        const result = await getAudits();

        if (result.success && Array.isArray(result.audits)) {
          auditRecords = result.audits.map((audit: BackendAudit) => ({
            id: Number(audit.id),
            action: Number(audit.action),
            actor: audit.actor,
            targetId: audit.targetId,
            details: audit.details,
            timestamp: Number(audit.timestamp),
          }));
        }
      } catch (error) {
        console.warn("Backend audit read failed. Using blockchain:", error);

        const total = await auditContract.getTotalAudits();

        const count = Number(total);

        for (let i = 1; i <= count; i++) {
          try {
            const record = await auditContract.getAudit(i);

            auditRecords.push({
              id: Number(record[0]),
              action: Number(record[1]),
              actor: record[2],
              targetId: record[3],
              details: record[4],
              timestamp: Number(record[5]),
            });
          } catch (readError) {
            console.warn("Audit read failed:", i, readError);
          }
        }
      }

      auditRecords.sort((a, b) => b.id - a.id);

      setAudits(auditRecords);

      // ======================================================
      // USERS
      // ======================================================

      const userMap = new Map<string, UserRecord>();

      for (const audit of auditRecords) {
        if (audit.action === 0) {
          const name = audit.details.replace("User created: ", "").trim();

          if (!userMap.has(audit.targetId)) {
            userMap.set(audit.targetId, {
              did: audit.targetId,
              name: name || "Unknown User",
              actor: audit.actor,
              timestamp: audit.timestamp,
            });
          }
        }
      }

      setUsers(Array.from(userMap.values()));

      // ======================================================
      // ROLES
      // ======================================================

      const roleRecords: RoleRecord[] = [];

      for (const audit of auditRecords) {
        if (audit.action === 1) {
          const roleMatch = audit.details.match(/Role assigned:\s*(.+)/i);

          roleRecords.push({
            wallet: audit.targetId,
            role: roleMatch?.[1] ?? "UNKNOWN",
            actor: audit.actor,
            timestamp: audit.timestamp,
          });
        }
      }

      setRoles(roleRecords);

      // ======================================================
      // ASSETS
      // ======================================================

      const assetRecords: AssetRecord[] = [];

      const MAX_SCAN = 100;

      for (let tokenId = 1; tokenId <= MAX_SCAN; tokenId++) {
        try {
          const asset = await assetContract.getAsset(tokenId);

          const actualTokenId = Number(asset[0]);

          const active = Boolean(asset[5]);

          if (actualTokenId > 0 && active) {
            assetRecords.push({
              tokenId: actualTokenId,
              assetId: asset[1],
              assetName: asset[2],
              assetType: asset[3],
              owner: asset[4],
              active,
            });
          }
        } catch {
          // Token does not exist.
        }
      }

      setAssets(assetRecords);

      // ======================================================
      // CONNECTED USER
      // ======================================================

      if (walletAddress) {
        try {
          await updateConnectedWallet(walletAddress);
        } catch {
          // Ignore
        }
      }

      setBlockchainConnected(true);

      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Blockchain loading failed:", error);

      setBlockchainConnected(false);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CONNECT WALLET
  // ==========================================================

  async function handleConnectWallet() {
    try {
      setTransactionStatus("Connecting wallet...");

      const wallet = await connectWallet();

      await updateConnectedWallet(wallet.address);

      setTransactionStatus("✅ Wallet connected successfully.");

      await loadBlockchainData();
    } catch (error: unknown) {
      console.error("Wallet connection failed:", error);

      setTransactionStatus(getErrorMessage(error));
    }
  }

  // ==========================================================
  // CREATE USER - BACKEND
  // ==========================================================

  async function handleCreateUser() {
    try {
      setTransactionStatus("Checking admin access...");

      const wallet = await connectWallet();

      await updateConnectedWallet(wallet.address);

      const role = await rbacContract.getRole(wallet.address);

      if (Number(role) !== ADMIN_ROLE) {
        setTransactionStatus("❌ Access denied: only ADMIN can create users.");
        return;
      }

      if (!ethers.isAddress(newUserWallet)) {
        setTransactionStatus("❌ Invalid wallet address.");
        return;
      }

      if (!newUserName.trim()) {
        setTransactionStatus("❌ Please enter user name.");
        return;
      }

      if (!newUserDid.trim()) {
        setTransactionStatus("❌ Please enter DID.");
        return;
      }

      setTransactionStatus("⏳ Creating user through backend...");

      const result = await createUser(
        newUserWallet,
        newUserName.trim(),
        newUserDid.trim(),
      );

      if (!result.success) {
        throw new Error(result.error || "User creation failed");
      }

      setTransactionStatus(
        `✅ User created successfully! TX: ${shortAddress(
          result.transactionHash || "",
        )}`,
      );

      setNewUserWallet("");
      setNewUserName("");
      setNewUserDid("");

      await loadBlockchainData();
    } catch (error: unknown) {
      console.error("Create user failed:", error);

      setTransactionStatus(getErrorMessage(error));
    }
  }

  // ==========================================================
  // ASSIGN ROLE - BACKEND
  // ==========================================================

  async function handleAssignRole() {
    try {
      setRoleStatus("Checking admin access...");

      const wallet = await connectWallet();

      await updateConnectedWallet(wallet.address);

      const currentRole = await rbacContract.getRole(wallet.address);

      if (Number(currentRole) !== ADMIN_ROLE) {
        setRoleStatus("❌ Access denied: only ADMIN can assign roles.");
        return;
      }

      if (!ethers.isAddress(roleWallet)) {
        setRoleStatus("❌ Invalid wallet address.");
        return;
      }

      const roleNumber = Number(selectedRole);

      if (!Number.isInteger(roleNumber) || roleNumber < 1 || roleNumber > 4) {
        setRoleStatus("❌ Invalid role selected.");
        return;
      }

      setRoleStatus("⏳ Assigning role through backend...");

      const result = await assignRole(roleWallet, roleNumber);

      if (!result.success) {
        throw new Error(result.error || "Role assignment failed");
      }

      setRoleStatus(
        `✅ ${ROLE_NAMES[roleNumber]} role assigned successfully! TX: ${shortAddress(
          result.transactionHash || "",
        )}`,
      );

      setRoleWallet("");
      setSelectedRole("4");

      await loadBlockchainData();
    } catch (error: unknown) {
      console.error("Assign role failed:", error);

      setRoleStatus(getErrorMessage(error));
    }
  }

  // ==========================================================
  // MINT ASSET - BACKEND
  // ==========================================================

  async function handleMintAsset() {
    try {
      setAssetStatus("Checking admin access...");

      const wallet = await connectWallet();

      await updateConnectedWallet(wallet.address);

      const currentRole = await rbacContract.getRole(wallet.address);

      if (Number(currentRole) !== ADMIN_ROLE) {
        setAssetStatus("❌ Access denied: only ADMIN can mint assets.");
        return;
      }

      if (!assetId.trim()) {
        setAssetStatus("❌ Please enter Asset ID.");
        return;
      }

      if (!assetName.trim()) {
        setAssetStatus("❌ Please enter Asset Name.");
        return;
      }

      if (!assetType.trim()) {
        setAssetStatus("❌ Please enter Asset Type.");
        return;
      }

      if (!ethers.isAddress(assetOwner)) {
        setAssetStatus("❌ Invalid owner wallet address.");
        return;
      }

      setAssetStatus("⏳ Minting asset through backend...");

      const result = await mintAsset(
        assetId.trim(),
        assetName.trim(),
        assetType.trim(),
        assetOwner,
      );

      if (!result.success) {
        throw new Error(result.error || "Asset minting failed");
      }

      setAssetStatus(
        `✅ Digital asset minted successfully! TX: ${shortAddress(
          result.transactionHash || "",
        )}`,
      );

      setAssetId("");
      setAssetName("");
      setAssetType("");
      setAssetOwner("");

      await loadBlockchainData();
    } catch (error: unknown) {
      console.error("Mint asset failed:", error);

      setAssetStatus(getErrorMessage(error));
    }
  }

  // ==========================================================
  // TRANSFER ASSET - BACKEND
  // ==========================================================

  async function handleTransferAsset() {
    try {
      setTransferStatus("Checking admin access...");

      const wallet = await connectWallet();

      await updateConnectedWallet(wallet.address);

      const currentRole = await rbacContract.getRole(wallet.address);

      if (Number(currentRole) !== ADMIN_ROLE) {
        setTransferStatus("❌ Access denied: only ADMIN can transfer assets.");
        return;
      }

      if (!transferTokenId.trim()) {
        setTransferStatus("❌ Please enter Token ID.");
        return;
      }

      const tokenId = Number(transferTokenId);

      if (!Number.isInteger(tokenId) || tokenId <= 0) {
        setTransferStatus("❌ Invalid Token ID.");
        return;
      }

      if (!ethers.isAddress(transferNewOwner)) {
        setTransferStatus("❌ Invalid new owner address.");
        return;
      }

      setTransferStatus("⏳ Checking asset through backend...");

      const assetResult = await getAsset(tokenId);

      if (
        !assetResult.success ||
        !assetResult.asset ||
        !assetResult.asset.active
      ) {
        setTransferStatus("❌ Asset does not exist or is inactive.");
        return;
      }

      setTransferStatus("⏳ Transferring asset through backend...");

      const result = await transferAsset(tokenId, transferNewOwner);

      if (!result.success) {
        throw new Error(result.error || "Asset transfer failed");
      }

      setTransferStatus(
        `✅ Asset transferred successfully! TX: ${shortAddress(
          result.transactionHash || "",
        )}`,
      );

      setTransferTokenId("");
      setTransferNewOwner("");

      await loadBlockchainData();
    } catch (error: unknown) {
      console.error("Transfer failed:", error);

      setTransferStatus(getErrorMessage(error));
    }
  }

  // ==========================================================
  // SEARCH ASSET - BACKEND
  // ==========================================================

  async function handleSearchAsset() {
    try {
      setAssetSearchStatus("Searching backend...");

      setSelectedAsset(null);

      if (!searchTokenId.trim()) {
        setAssetSearchStatus("❌ Enter Token ID.");
        return;
      }

      const tokenId = Number(searchTokenId);

      if (!Number.isInteger(tokenId) || tokenId <= 0) {
        setAssetSearchStatus("❌ Invalid Token ID.");
        return;
      }

      const result = await getAsset(tokenId);

      if (!result.success || !result.asset) {
        setAssetSearchStatus("❌ Asset not found.");
        return;
      }

      const asset = result.asset;

      setSelectedAsset({
        tokenId: Number(asset.tokenId),
        assetId: asset.assetId,
        assetName: asset.assetName,
        assetType: asset.assetType,
        owner: asset.owner,
        active: Boolean(asset.active),
      });

      setAssetSearchStatus("✅ Asset found on blockchain.");
    } catch (error: unknown) {
      console.error("Asset search failed:", error);

      setAssetSearchStatus(getErrorMessage(error));
    }
  }

  // ==========================================================
  // STABLE FIELD UPDATE
  // ==========================================================

  const updateField = (setter: (value: string) => void, value: string) => {
    const scrollY = window.scrollY;

    setter(value);

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: "auto",
      });
    });
  };

  // ==========================================================
  // ERROR HANDLER
  // ==========================================================

  function getErrorMessage(error: unknown): string {
    const errorData =
      typeof error === "object" && error !== null
        ? (error as {
            code?: unknown;
            reason?: unknown;
            shortMessage?: unknown;
            info?: { error?: { message?: unknown } };
            message?: unknown;
          })
        : {};

    if (errorData.code === 4001 || errorData.code === "ACTION_REJECTED") {
      return "❌ Transaction rejected in MetaMask.";
    }

    if (typeof errorData.reason === "string") {
      return `❌ ${errorData.reason}`;
    }

    if (typeof errorData.shortMessage === "string") {
      return `❌ ${errorData.shortMessage}`;
    }

    if (typeof errorData.info?.error?.message === "string") {
      return `❌ ${errorData.info.error.message}`;
    }

    if (typeof errorData.message === "string") {
      return `❌ ${errorData.message}`;
    }

    return "❌ Transaction failed.";
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  function getActionName(action: number) {
    return ACTION_NAMES[action] ?? "UNKNOWN";
  }

  function shortAddress(address: string) {
    if (!address) {
      return "-";
    }

    return address.slice(0, 6) + "..." + address.slice(-4);
  }

  function formatDate(timestamp: number) {
    if (!timestamp) {
      return "-";
    }

    return new Date(timestamp * 1000).toLocaleString();
  }

  // ==========================================================
  // FILTERED AUDITS
  // ==========================================================

  const filteredAudits = useMemo(() => {
    if (auditFilter === "ALL") {
      return audits;
    }

    const index = ACTION_NAMES.indexOf(auditFilter);

    return audits.filter((audit) => audit.action === index);
  }, [audits, auditFilter]);

  const isAdmin = connectedRole === "ADMIN";

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function navigate(tab: Tab) {
    setActiveTab(tab);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  }

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  function Sidebar() {
    return (
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-box">BEL</div>

          <div>
            <h2>BEL</h2>
            <span>Blockchain Security</span>
          </div>
        </div>

        <nav>
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => navigate("dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => navigate("users")}
          >
            <span>♙</span>
            Users
          </button>

          <button
            className={`nav-item ${activeTab === "assets" ? "active" : ""}`}
            onClick={() => navigate("assets")}
          >
            <span>◈</span>
            Digital Assets
          </button>

          <button
            className={`nav-item ${activeTab === "roles" ? "active" : ""}`}
            onClick={() => navigate("roles")}
          >
            <span>🔐</span>
            Roles & Access
          </button>

          <button
            className={`nav-item ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => navigate("audit")}
          >
            <span>▤</span>
            Audit Trail
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="network">
            <span className="status-dot"></span>

            <div>
              <strong>Blockchain</strong>

              <small>
                {blockchainConnected ? "Connected" : "Disconnected"}
              </small>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // ==========================================================
  // HEADER
  // ==========================================================

  function Header() {
    return (
      <header className="header">
        <div>
          <h1>
            {activeTab === "dashboard"
              ? "Dashboard"
              : activeTab === "users"
                ? "Users"
                : activeTab === "assets"
                  ? "Digital Assets"
                  : activeTab === "roles"
                    ? "Roles & Access"
                    : "Audit Trail"}
          </h1>

          <p>Blockchain Identity & Digital Asset Management</p>
        </div>

        <div className="header-right">
          <button className="connect-btn" onClick={handleConnectWallet}>
            {walletAddress ? shortAddress(walletAddress) : "Connect Wallet"}
          </button>

          <button className="view-btn" onClick={loadBlockchainData}>
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <div className="network-status">
            <span className="status-dot"></span>

            {blockchainConnected ? "Connected" : "Disconnected"}
          </div>

          <div className="profile">
            <div className="avatar">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <strong>{userName || "User"}</strong>

              <small>{walletAddress ? connectedRole : "Not Connected"}</small>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ==========================================================
  // STATS
  // ==========================================================

  function Stats() {
    return (
      <section className="stats">
        <div className="stat-card">
          <div className="stat-icon users-icon">♙</div>

          <div>
            <p>Total Users</p>

            <h2>{users.length}</h2>

            <span>Registered identities</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon asset-icon">◈</div>

          <div>
            <p>Digital Assets</p>

            <h2>{assets.length}</h2>

            <span>Blockchain assets</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon audit-icon">▤</div>

          <div>
            <p>Audit Records</p>

            <h2>{audits.length}</h2>

            <span>Immutable events</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon role-icon">🔐</div>

          <div>
            <p>Access Roles</p>

            <h2>4</h2>

            <span>RBAC roles</span>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  function Dashboard() {
    return (
      <>
        {Stats()}

        {/* CURRENT IDENTITY + BLOCKCHAIN */}

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Current Identity</h2>

                <p>Decentralized identity information</p>
              </div>

              <span className="badge active-badge">
                ● {userActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="identity">
              <div className="large-avatar">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="identity-info">
                <h3>{userName || "No Identity"}</h3>

                <div className="info-row">
                  <span>DID</span>

                  <strong>{userDid || "-"}</strong>
                </div>

                <div className="info-row">
                  <span>Wallet</span>

                  <strong>{shortAddress(walletAddress)}</strong>
                </div>

                <div className="info-row">
                  <span>Role</span>

                  <strong className="role-badge">{connectedRole}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Blockchain Network</h2>

                <p>Smart contract infrastructure</p>
              </div>

              <span className="badge active-badge">
                ● {blockchainConnected ? "Online" : "Offline"}
              </span>
            </div>

            <div className="blockchain-info">
              <div className="chain-row">
                <span>Network</span>

                <strong>Hardhat Localhost</strong>
              </div>

              <div className="chain-row">
                <span>Chain ID</span>

                <strong>{chainId || "31337"}</strong>
              </div>

              <div className="chain-row">
                <span>Block Number</span>

                <strong>{blockNumber ?? "-"}</strong>
              </div>

              <div className="chain-row">
                <span>RPC</span>

                <strong>127.0.0.1:8545</strong>
              </div>

              <div className="chain-row">
                <span>Identity</span>

                <strong>{shortAddress(CONTRACTS.identity)}</strong>
              </div>

              <div className="chain-row">
                <span>RBAC</span>

                <strong>{shortAddress(CONTRACTS.rbac)}</strong>
              </div>

              <div className="chain-row">
                <span>AssetNFT</span>

                <strong>{shortAddress(CONTRACTS.assetNFT)}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM STATUS */}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>System Status</h2>

              <p>Backend and blockchain connectivity</p>
            </div>

            <span className="badge active-badge">● {backendStatus}</span>
          </div>

          <div className="form-grid">
            <div className="info-row">
              <span>Backend</span>

              <strong>{backendStatus}</strong>
            </div>

            <div className="info-row">
              <span>Blockchain</span>

              <strong>
                {blockchainConnected ? "Connected" : "Disconnected"}
              </strong>
            </div>

            <div className="info-row">
              <span>Chain ID</span>

              <strong>{chainId || "-"}</strong>
            </div>

            <div className="info-row">
              <span>Block Number</span>

              <strong>{blockNumber ?? "-"}</strong>
            </div>
          </div>
        </section>

        {/* SECURITY STATUS */}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Security Status</h2>

              <p>Current blockchain access controls</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="info-row">
              <span>Identity Management</span>

              <strong>✓ RBAC Protected</strong>
            </div>

            <div className="info-row">
              <span>Asset Minting</span>

              <strong>✓ ADMIN Only</strong>
            </div>

            <div className="info-row">
              <span>Asset Transfer</span>

              <strong>✓ ADMIN Only</strong>
            </div>

            <div className="info-row">
              <span>Audit Trail</span>

              <strong>✓ On-chain</strong>
            </div>
          </div>
        </section>

        {RecentActivity()}
      </>
    );
  }

  // ==========================================================
  // USERS PAGE
  // ==========================================================

  function UsersPage() {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Registered Users</h2>

            <p>Decentralized identities recorded on blockchain</p>
          </div>

          <span className="badge active-badge">{users.length} Users</span>
        </div>

        <div className="asset-table">
          <div className="asset-header">
            <span>Name</span>
            <span>DID</span>
            <span>Creator</span>
            <span>Created</span>
            <span>Status</span>
          </div>

          {users.map((user, index) => (
            <div className="asset-row" key={`${user.did}-${index}`}>
              <strong>{user.name}</strong>

              <span>{user.did}</span>

              <span>{shortAddress(user.actor)}</span>

              <span>{formatDate(user.timestamp)}</span>

              <span className="asset-status">● Registered</span>
            </div>
          ))}

          {users.length === 0 && (
            <div className="empty-assets">No registered users found.</div>
          )}
        </div>
      </section>
    );
  }

  // ==========================================================
  // ASSETS PAGE
  // ==========================================================

  function AssetsPage() {
    return (
      <>
        {/* ASSET SEARCH */}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Asset Lookup</h2>

              <p>Search a digital asset by Token ID</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Token ID</label>

              <input
                type="number"
                min="1"
                placeholder="1"
                value={searchTokenId}
                onChange={(e) => updateField(setSearchTokenId, e.target.value)}
              />
            </div>
          </div>

          <button className="admin-btn" onClick={handleSearchAsset}>
            Search Asset
          </button>

          {assetSearchStatus && (
            <div className="transaction-status">{assetSearchStatus}</div>
          )}

          {selectedAsset && (
            <div
              className="panel"
              style={{
                marginTop: "20px",
              }}
            >
              <h3>Asset Details</h3>

              <div className="blockchain-info">
                <div className="chain-row">
                  <span>Token ID</span>

                  <strong>#{selectedAsset.tokenId}</strong>
                </div>

                <div className="chain-row">
                  <span>Asset ID</span>

                  <strong>{selectedAsset.assetId}</strong>
                </div>

                <div className="chain-row">
                  <span>Name</span>

                  <strong>{selectedAsset.assetName}</strong>
                </div>

                <div className="chain-row">
                  <span>Type</span>

                  <strong>{selectedAsset.assetType}</strong>
                </div>

                <div className="chain-row">
                  <span>Owner</span>

                  <strong>{selectedAsset.owner}</strong>
                </div>

                <div className="chain-row">
                  <span>Status</span>

                  <strong>
                    {selectedAsset.active ? "Active" : "Inactive"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ALL ASSETS */}

        <section className="panel asset-panel">
          <div className="panel-header">
            <div>
              <h2>All Digital Assets</h2>

              <p>On-chain ownership registry</p>
            </div>

            <span className="badge active-badge">● On-chain</span>
          </div>

          <div className="asset-table">
            <div className="asset-header">
              <span>Token ID</span>

              <span>Asset ID</span>

              <span>Name</span>

              <span>Type</span>

              <span>Owner</span>

              <span>Status</span>
            </div>

            {assets.map((asset) => (
              <div className="asset-row" key={asset.tokenId}>
                <strong>#{asset.tokenId}</strong>

                <span>{asset.assetId}</span>

                <span>{asset.assetName}</span>

                <span>{asset.assetType}</span>

                <span className="address">{shortAddress(asset.owner)}</span>

                <span className="asset-status">
                  ● {asset.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}

            {assets.length === 0 && (
              <div className="empty-assets">No digital assets found.</div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ==========================================================
  // ROLES PAGE
  // ==========================================================

  function RolesPage() {
    return (
      <>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Role Based Access Control</h2>

              <p>Blockchain permission management</p>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-icon role-icon">A</div>

              <div>
                <p>ADMIN</p>

                <span>Full management access</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon role-icon">M</div>

              <div>
                <p>MANAGER</p>

                <span>Operational access</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon role-icon">A</div>

              <div>
                <p>AUDITOR</p>

                <span>Audit visibility</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon role-icon">U</div>

              <div>
                <p>USER</p>

                <span>Standard access</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Role Assignment History</h2>

              <p>Recorded RBAC changes</p>
            </div>
          </div>

          <div className="asset-table">
            <div className="asset-header">
              <span>Wallet</span>

              <span>Role</span>

              <span>Assigned By</span>

              <span>Date</span>
            </div>

            {roles.map((role, index) => (
              <div className="asset-row" key={`${role.wallet}-${index}`}>
                <span>{shortAddress(role.wallet)}</span>

                <strong>{role.role}</strong>

                <span>{shortAddress(role.actor)}</span>

                <span>{formatDate(role.timestamp)}</span>
              </div>
            ))}

            {roles.length === 0 && (
              <div className="empty-assets">
                No role assignment records found.
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ==========================================================
  // AUDIT PAGE
  // ==========================================================

  function AuditPage() {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Blockchain Audit Trail</h2>

            <p>Immutable activity records</p>
          </div>

          <span className="badge active-badge">{audits.length} Records</span>
        </div>

        <div
          className="form-group"
          style={{
            marginBottom: "20px",
          }}
        >
          <label>Filter Events</label>

          <select
            value={auditFilter}
            onChange={(e) => updateField(setAuditFilter, e.target.value)}
          >
            <option value="ALL">All Events</option>

            {ACTION_NAMES.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="activity-list">
          {filteredAudits.map((audit) => (
            <div className="activity" key={audit.id}>
              <div className="activity-icon">
                {audit.action === 2
                  ? "◆"
                  : audit.action === 3
                    ? "↗"
                    : audit.action === 1
                      ? "♙"
                      : "+"}
              </div>

              <div className="activity-details">
                <strong>
                  #{audit.id} {getActionName(audit.action)}
                </strong>

                <span>Target: {audit.targetId}</span>

                <span>{audit.details}</span>

                <span>Actor: {shortAddress(audit.actor)}</span>

                <span>{formatDate(audit.timestamp)}</span>
              </div>

              <div className="activity-status">✓ Confirmed</div>
            </div>
          ))}

          {filteredAudits.length === 0 && (
            <div className="empty-assets">No audit records found.</div>
          )}
        </div>
      </section>
    );
  }

  // ==========================================================
  // RECENT ACTIVITY
  // ==========================================================

  function RecentActivity() {
    return (
      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <h2>Recent Blockchain Activity</h2>

            <p>Latest immutable audit events</p>
          </div>

          <button className="view-btn" onClick={() => navigate("audit")}>
            View All
          </button>
        </div>

        <div className="activity-list">
          {audits.slice(0, 5).map((audit) => (
            <div className="activity" key={audit.id}>
              <div className="activity-icon">
                {audit.action === 2
                  ? "◆"
                  : audit.action === 3
                    ? "↗"
                    : audit.action === 1
                      ? "♙"
                      : "+"}
              </div>

              <div className="activity-details">
                <strong>{getActionName(audit.action)}</strong>

                <span>
                  {audit.targetId}
                  {" — "}
                  {audit.details}
                </span>
              </div>

              <div className="activity-status">✓ Confirmed</div>
            </div>
          ))}

          {audits.length === 0 && (
            <div className="empty-assets">No blockchain activity found.</div>
          )}
        </div>
      </section>
    );
  }

  // ==========================================================
  // ADMIN PANEL
  // ==========================================================

  function AdminPanel() {
    if (!isAdmin) {
      return (
        <section className="panel admin-panel">
          <div className="panel-header">
            <div>
              <h2>Admin Control Panel</h2>

              <p>Restricted blockchain management</p>
            </div>

            <span className="badge">🔒 {connectedRole}</span>
          </div>

          <div className="permission-warning">
            🔒 Only ADMIN can manage users, roles and assets.
            <br />
            Connect MetaMask with an ADMIN wallet.
          </div>
        </section>
      );
    }

    return (
      <section className="panel admin-panel">
        <div className="panel-header">
          <div>
            <h2>Admin Control Panel</h2>

            <p>Manage identities, roles and digital assets</p>
          </div>

          <span className="badge active-badge">🔐 ADMIN</span>
        </div>

        {/* ==================================================
            CREATE USER
        ================================================== */}

        <div className="admin-form">
          <h3>Create New User</h3>

          <p className="form-description">
            Create a decentralized identity on the blockchain.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Wallet Address</label>

              <input
                type="text"
                placeholder="0x..."
                value={newUserWallet}
                onChange={(e) => updateField(setNewUserWallet, e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>User Name</label>

              <input
                type="text"
                placeholder="Rahul"
                value={newUserName}
                onChange={(e) => updateField(setNewUserName, e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label>Decentralized ID</label>

              <input
                type="text"
                placeholder="did:bel:rahul001"
                value={newUserDid}
                onChange={(e) => updateField(setNewUserDid, e.target.value)}
              />
            </div>
          </div>

          <button className="admin-btn" onClick={handleCreateUser}>
            Create User
          </button>

          {transactionStatus && (
            <div className="transaction-status">{transactionStatus}</div>
          )}
        </div>

        {/* ==================================================
            ASSIGN ROLE
        ================================================== */}

        <div className="admin-form">
          <h3>Assign Access Role</h3>

          <p className="form-description">
            Assign RBAC permissions to a blockchain wallet.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>User Wallet</label>

              <input
                type="text"
                placeholder="0x..."
                value={roleWallet}
                onChange={(e) => updateField(setRoleWallet, e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Role</label>

              <select
                value={selectedRole}
                onChange={(e) => updateField(setSelectedRole, e.target.value)}
              >
                <option value="1">ADMIN</option>

                <option value="2">MANAGER</option>

                <option value="3">AUDITOR</option>

                <option value="4">USER</option>
              </select>
            </div>
          </div>

          <button className="admin-btn" onClick={handleAssignRole}>
            Assign Role
          </button>

          {roleStatus && <div className="transaction-status">{roleStatus}</div>}
        </div>

        {/* ==================================================
            MINT ASSET
        ================================================== */}

        <div className="admin-form">
          <h3>Mint Digital Asset</h3>

          <p className="form-description">
            Register a unique blockchain asset.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Asset ID</label>

              <input
                type="text"
                placeholder="LAP003"
                value={assetId}
                onChange={(e) => updateField(setAssetId, e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Asset Name</label>

              <input
                type="text"
                placeholder="Dell Latitude 5440"
                value={assetName}
                onChange={(e) => updateField(setAssetName, e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Asset Type</label>

              <input
                type="text"
                placeholder="Laptop"
                value={assetType}
                onChange={(e) => updateField(setAssetType, e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Owner Wallet</label>

              <input
                type="text"
                placeholder="0x..."
                value={assetOwner}
                onChange={(e) => updateField(setAssetOwner, e.target.value)}
              />
            </div>
          </div>

          <button className="admin-btn" onClick={handleMintAsset}>
            Mint Digital Asset
          </button>

          {assetStatus && (
            <div className="transaction-status">{assetStatus}</div>
          )}
        </div>

        {/* ==================================================
            TRANSFER ASSET
        ================================================== */}

        <div className="admin-form">
          <h3>Transfer Digital Asset</h3>

          <p className="form-description">
            Only ADMIN can change blockchain asset ownership.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Token ID</label>

              <input
                type="number"
                min="1"
                placeholder="1"
                value={transferTokenId}
                onChange={(e) =>
                  updateField(setTransferTokenId, e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>New Owner Wallet</label>

              <input
                type="text"
                placeholder="0x..."
                value={transferNewOwner}
                onChange={(e) =>
                  updateField(setTransferNewOwner, e.target.value)
                }
              />
            </div>
          </div>

          <button className="admin-btn" onClick={handleTransferAsset}>
            Transfer Asset
          </button>

          {transferStatus && (
            <div className="transaction-status">{transferStatus}</div>
          )}
        </div>
      </section>
    );
  }

  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <div className="app">
      {Sidebar()}

      <main className="main">
        {Header()}

        {/* DASHBOARD */}

        {activeTab === "dashboard" && (
          <>
            {Dashboard()}
            {AdminPanel()}
          </>
        )}

        {/* USERS */}

        {activeTab === "users" && UsersPage()}

        {/* ASSETS */}

        {activeTab === "assets" && AssetsPage()}

        {/* ROLES */}

        {activeTab === "roles" && RolesPage()}

        {/* AUDIT */}

        {activeTab === "audit" && AuditPage()}

        {/* FOOTER */}

        <footer
          style={{
            marginTop: "30px",
            padding: "20px 0",
            textAlign: "center",
            opacity: 0.65,
          }}
        >
          <p>BEL Blockchain Identity & Digital Asset Management</p>

          <small>
            Hardhat Localhost • Chain ID 31337 • Last refresh:{" "}
            {lastRefresh || "-"}
          </small>
        </footer>
      </main>
    </div>
  );
}

export default App;
