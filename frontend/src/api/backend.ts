const API_BASE_URL = "http://localhost:5000/api";

type ApiData = Record<string, any>;

// Generic API helper
async function request(endpoint: string, options: RequestInit = {}): Promise<ApiData> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(options.headers).entries()),
    },
    ...options,
  });

  const data = (await response.json()) as ApiData;

  if (!response.ok) {
    throw new Error(data.error || "Backend request failed");
  }

  return data;
}

// ================================
// HEALTH
// ================================

export async function getHealth() {
  return request("/health");
}

// ================================
// USERS
// ================================

export async function getUser(wallet: string) {
  return request(`/users/${wallet}`);
}

export async function createUser(wallet: string, name: string, did: string) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify({
      wallet,
      name,
      did,
    }),
  });
}

export async function deactivateUser(wallet: string) {
  return request(`/users/${wallet}/deactivate`, {
    method: "PATCH",
  });
}

// ================================
// ROLES
// ================================

export async function getRole(wallet: string) {
  return request(`/roles/${wallet}`);
}

export async function assignRole(wallet: string, role: string | number) {
  return request("/roles", {
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
  return request(`/assets/${tokenId}`);
}

export async function getOwnerAssets(wallet: string) {
  return request(`/assets/owner/${wallet}`);
}

export async function mintAsset(
  assetId: string,
  assetName: string,
  assetType: string,
  owner: string,
) {
  return request("/assets", {
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
  return request(`/assets/${tokenId}/transfer`, {
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
  return request("/audits");
}

export async function getAudit(id: string | number) {
  return request(`/audits/${id}`);
}
