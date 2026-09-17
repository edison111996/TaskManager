import { apiFetch } from "./httpClient";

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface AuthResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: UserSummary;
}

export interface MeResponse extends UserSummary {
  permissions: string[];
}

export function login(email: string, password: string) {
  return apiFetch<AuthResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export function register(firstName: string, lastName: string, email: string, password: string) {
  return apiFetch<AuthResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, password }),
    skipAuth: true,
  });
}

// Usa la cookie httpOnly (el navegador la manda solo) para pedir un access token nuevo.
export function refreshSession() {
  return apiFetch<AuthResult>("/api/auth/refresh-token", {
    method: "POST",
    skipAuth: true,
  });
}

export function logout() {
  return apiFetch<void>("/api/auth/revoke-token", {
    method: "POST",
    skipAuth: true,
  });
}

export function fetchMe() {
  return apiFetch<MeResponse>("/api/auth/me");
}
