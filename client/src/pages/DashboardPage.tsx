import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

export function DashboardPage() {
  const { user, permissions } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hola, {user?.firstName} 👋</h1>
        <p className="text-slate-500">Esto es lo que sabe la app de tu sesión (viene de /api/auth/me).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold text-slate-700">Tus roles</h2>
          <div className="flex flex-wrap gap-2">
            {user?.roles.map((role) => (
              <Badge key={role} tone="blue">
                {role}
              </Badge>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold text-slate-700">Tus permisos ({permissions.length})</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission}>{permission}</Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
