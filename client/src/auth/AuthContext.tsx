import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  fetchMe,
  type UserSummary,
} from "../api/auth";
import { setAccessToken, setUnauthorizedHandler, NetworkError } from "../api/httpClient";
import { useToast } from "../components/ToastProvider";

interface AuthContextValue {
  user: UserSummary | null;
  permissions: string[];
  /** Atajo para permissions.includes("Modulo:Accion") — ej. hasPermission("Tasks:Create") */
  hasPermission: (permissionCode: string) => boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadPermissions() {
    try {
      const me = await fetchMe();
      setPermissions(me.permissions);
    } catch {
      setPermissions([]);
    }
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setUser(null);
      setPermissions([]);
    });

    // Al montar la app: no hay access token en memoria (se perdió con el F5),
    // pero el navegador SÍ tiene la cookie httpOnly del refresh token.
    // La usamos para recuperar la sesión sin pedir login de nuevo.
    refreshSession()
      .then(async (result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
        await loadPermissions();
      })
      .catch((err) => {
        // Si es NetworkError, el backend no respondió a tiempo (caído/colgado) — no es
        // lo mismo que "todavía no iniciaste sesión", así que sí vale la pena avisar.
        if (err instanceof NetworkError) {
          showToast(err.message, "error");
        }
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await apiLogin(email, password);
    setAccessToken(result.accessToken);
    setUser(result.user);
    await loadPermissions();
  }

  async function logout() {
    await apiLogout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setPermissions([]);
  }

  function hasPermission(permissionCode: string) {
    return permissions.includes(permissionCode);
  }

  return (
    <AuthContext.Provider value={{ user, permissions, hasPermission, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
