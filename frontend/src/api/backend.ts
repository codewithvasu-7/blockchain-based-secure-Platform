const API_BASE_URL = "http://localhost:5000/api";

// Generic API helper
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

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

export async function getUser(wallet) {
  return request(`/users/${wallet}`);
}

export async function createUser(wallet, name, did) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify({
      wallet,
      name,
      did,
    }),
  });
}

export async function deactivateUser(wallet) {
  return request(`/users/${wallet}/deactivate`, {
    method: "PATCH",
  });
}

// ================================
// ROLES
// ================================

export async function getRole(wallet) {
  return request(`/roles/${wallet}`);
}

export async function assignRole(wallet, role) {
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

export async function getAsset(tokenId) {
  return request(`/assets/${tokenId}`);
}

export async function getOwnerAssets(wallet) {
  return request(`/assets/owner/${wallet}`);
}

export async function mintAsset(assetId, assetName, assetType, owner) {
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

export async function transferAsset(tokenId, newOwner) {
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

export async function getAudit(id) {
  return request(`/audits/${id}`);
}
