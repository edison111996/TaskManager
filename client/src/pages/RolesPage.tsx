import { useEffect, useState } from "react";
import { listRoles, deleteRole, type RoleDto } from "../api/roles";
import { listModules, type ModuleDto } from "../api/modules";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { RoleFormModal } from "./RoleFormModal";

export function RolesPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("Roles:Create");
  const canEdit = hasPermission("Roles:Edit");
  const canDelete = hasPermission("Roles:Delete");
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadRoles() {
    listRoles()
      .then(setRoles)
      .catch(() => setError("No se pudo cargar la lista de roles."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadRoles();
    listModules().then(setModules).catch(() => undefined);
  }, []);

  async function handleDelete(role: RoleDto) {
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    setDeletingId(role.id);
    try {
      await deleteRole(role.id);
      showToast("Rol eliminado", "success");
      loadRoles();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar el rol.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Roles</h1>
        {canCreate && <Button onClick={() => setIsCreating(true)}>+ Nuevo rol</Button>}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-800">{role.name}</h2>
                {role.description && <p className="text-sm text-slate-500">{role.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {canEdit && (
                  <Button variant="secondary" onClick={() => setEditingRole(role)}>
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" isLoading={deletingId === role.id} onClick={() => handleDelete(role)}>
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {role.permissions.map((permission) => (
                <Badge key={permission}>{permission}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {isCreating && (
        <RoleFormModal modules={modules} onClose={() => setIsCreating(false)} onSaved={loadRoles} />
      )}

      {editingRole && canEdit && (
        <RoleFormModal
          modules={modules}
          editingRole={editingRole}
          onClose={() => setEditingRole(null)}
          onSaved={loadRoles}
        />
      )}
    </div>
  );
}
