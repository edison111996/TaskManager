import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "./AuthContext";

// Protege una RUTA por permiso (ProtectedRoute solo exige estar logueado). El backend ya
// bloquea los datos; esto evita que el usuario vea una pantalla rota y le explica por qué.
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <ShieldOff size={40} className="text-slate-400" />
      <h2 className="text-xl font-semibold text-slate-800">No tienes acceso a esta sección</h2>
      <p className="max-w-sm text-sm text-slate-500">
        Tu rol no incluye el permiso necesario. Si crees que es un error, pídele al administrador que lo revise.
      </p>
      <Link to="/" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Volver al inicio
      </Link>
    </div>
  );
}
