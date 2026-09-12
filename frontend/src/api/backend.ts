const API_BASE_URL = "http://localhost:5000/api";

type ApiData = Record<string, unknown>;

type HealthResponse = ApiData & {
  success: boolean;
  blockchain: {
    connected: boolean;
    chainId: string | number;
    blockNumber: number;
  };
};

type UserResponse = ApiData & {
  success: boolean;
  user?: {
    name: string;
    did: string;
    active: boolean;
  };
};

type TransactionResponse = ApiData & {
  success: boolean;
  error?: string;
  transactionHash?: string;
};

type Asset = {
  tokenId: number;
  assetId: string;
  assetName: string;
  assetType: string;
  owner: string;
  active: boolean;
};

type AssetResponse = ApiData & {
  success: boolean;
  error?: string;
  asset?: Asset;
};

type AuditsResponse = ApiData & {
  success: boolean;
  audits?: Array<{
    id: number;
    action: number;
    actor: string;
    targetId: string;
    details: string;
    timestamp: number;
  }>;
};

// Generic API helper
async function request<T extends ApiData>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(options.headers).entries()),
    },
    ...options,
  });

  const data = (await response.json()) as T;

  if (!response.ok) {
    const error = typeof data.error === "string" ? data.error : "Backend request failed";

    throw new Error(error);
  }

  return data;
}

// ================================
// HEALTH
// ================================

export async function getHealth() {
  return request<HealthResponse>("/health");
}

// ================================
// USERS
// ================================

export async function getUser(wallet: string) {
  return request<UserResponse>(`/users/${wallet}`);
}

export async function createUser(wallet: string, name: string, did: string) {
  return request<TransactionResponse>("/users", {
    method: "POST",
    body: JSON.stringify({
      wallet,
      name,
      did,
    }),
  });
}

export async function deactivateUser(wallet: string) {
  return request<TransactionResponse>(`/users/${wallet}/deactivate`, {
    method: "PATCH",
  });
}

// ================================
// ROLES
// ================================

export async function getRole(wallet: string) {
  return request<ApiData>(`/roles/${wallet}`);
}

export async function assignRole(wallet: string, role: string | number) {
  return request<TransactionResponse>("/roles", {
    method: "POST",
    body: JSON.stringify({
      wallet,
      role,
    }),
  });
}

// ================================
// ASSETS
// ================================

export async function getAsset(tokenId: string | number) {
  return request<AssetResponse>(`/assets/${tokenId}`);
}

export async function getOwnerAssets(wallet: string) {
  return request<ApiData>(`/assets/owner/${wallet}`);
}

export async function mintAsset(
  assetId: string,
  assetName: string,
  assetType: string,
  owner: string,
) {
  return request<TransactionResponse>("/assets", {
    method: "POST",
    body: JSON.stringify({
      assetId,
      assetName,
      assetType,
      owner,
    }),
  });
}

export async function transferAsset(tokenId: string | number, newOwner: string) {
  return request<TransactionResponse>(`/assets/${tokenId}/transfer`, {
    method: "POST",
    body: JSON.stringify({
      newOwner,
    }),
  });
}

// ================================
// AUDIT
// ================================

export async function getAudits() {
  return request<AuditsResponse>("/audits");
}

export async function getAudit(id: string | number) {
  return request<ApiData>(`/audits/${id}`);
}
