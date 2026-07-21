// Auth API wrappers. All calls go through the shared request() helper, which
// sets credentials:"include" so the httpOnly session cookie flows automatically
// on login/logout/getMe — no token handling in JS code.

import { request, USE_MOCK, AuthError } from "./api";

// In mock mode there's no backend, so we simulate a persistent-across-reload
// "signed in" user in memory. This lets the app render normally offline.
let mockUser = null;

export async function register({ email, username, password }) {
  if (USE_MOCK) {
    mockUser = { id: "mock-user", email, username, createdAt: new Date().toISOString() };
    return { user: mockUser };
  }
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
}

export async function login({ email, password }) {
  if (USE_MOCK) {
    mockUser = { id: "mock-user", email, username: email.split("@")[0], createdAt: new Date().toISOString() };
    return { user: mockUser };
  }
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  if (USE_MOCK) {
    mockUser = null;
    return { ok: true };
  }
  return request("/api/auth/logout", { method: "POST" });
}

// Returns the signed-in user, or null if the session cookie is missing/expired.
// AuthContext calls this on mount to decide whether to render as signed in.
export async function getMe() {
  if (USE_MOCK) return mockUser;
  try {
    return await request("/api/auth/me");
  } catch (err) {
    if (err instanceof AuthError) return null;
    throw err;
  }
}
