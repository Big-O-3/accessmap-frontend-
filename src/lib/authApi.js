// Auth API wrappers. All calls go through the shared request() helper, which
// sets credentials:"include" so the httpOnly session cookie flows automatically
// on login/logout/getMe — no token handling in JS code.

import { request, AuthError } from "./api";

export async function register({ email, username, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
}

export async function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

// Returns the signed-in user, or null if the session cookie is missing/expired.
// AuthContext calls this on mount to decide whether to render as signed in.
export async function getMe() {
  try {
    return await request("/api/auth/me");
  } catch (err) {
    if (err instanceof AuthError) return null;
    throw err;
  }
}
