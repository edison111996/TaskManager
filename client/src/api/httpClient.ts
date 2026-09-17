const API_URL = import.meta.env.VITE_API_URL as string;
const REQUEST_TIMEOUT_MS = 10000;

/** Se lanza cuando el backend no respondió a tiempo (caído, colgado, sin red) — a
 * diferencia de un 401/404/500, que sí es una respuesta real del servidor. */
export class NetworkError extends Error {}

function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal })
    .catch((err) => {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new NetworkError("No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.");
      }
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
}

// El access token vive SOLO en memoria (esta variable), nunca en localStorage.
// Se pierde a propósito al recargar la página; por eso al montar la app
// (ver AuthContext) se pide uno nuevo con el refresh token de la cookie.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface ApiFetchOptions extends RequestInit {
  /** true para endpoints de auth que no deben mandar/renovar el access token (login, refresh...) */
  skipAuth?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Si ya hay un refresh en curso (varias requests fallaron a la vez), reusa la misma promesa
  // en vez de disparar múltiples refresh-token en paralelo.
  refreshPromise ??= fetchWithTimeout(`${API_URL}/api/auth/refresh-token`, {
    method: "POST",
    credentials: "include", // manda la cookie httpOnly con el refresh token
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      accessToken = data.accessToken as string;
      return accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const doFetch = (token: string | null) =>
    fetchWithTimeout(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

  let response = await doFetch(accessToken);

  // Access token expirado (15 min) -> pide uno nuevo con el refresh token y reintenta UNA vez.
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    } else {
      onUnauthorized?.();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Error ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
