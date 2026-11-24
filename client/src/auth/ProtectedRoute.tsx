import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { LoadingState } from "../components/LoadingState";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Cargando sesión..." />;
  }

  if (!user) {
    // "from" permite que el login devuelva al usuario a la página que intentaba abrir.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
