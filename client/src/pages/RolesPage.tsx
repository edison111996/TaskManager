import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { listRoles, deleteRole, type RoleDto } from "../api/roles";
import { listModules } from "../api/modules";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";
import { useAuth } from "../auth/AuthContext";
import { RoleFormModal } from "./RoleFormModal";

export function RolesPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("Roles:Create");
  const canEdit = hasPermission("Roles:Edit");
  const canDelete = hasPermission("Roles:Delete");
  const { data: roles = [], isLoading, error, reload: loadRoles, retry } = useFetch(
    listRoles,
    "No se pudo cargar la lista de roles.",
  );
  // Los módulos solo alimentan el formulario: si fallan, la página sigue funcionando.
  const { data: modules = [] } = useFetch(listModules);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(role: RoleDto) {
    if (!(await confirm({ message: `¿Eliminar el rol "${role.name}"?` }))) return;
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
  if (error && roles.length === 0) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Roles</h1>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsCreating(true)}>
            Nuevo rol
          </Button>
        )}
      </div>

      {roles.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Todavía no hay roles. Creá el primero con el botón de arriba.
        </p>
      )}

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
                  <Button variant="secondary" icon={Pencil} onClick={() => setEditingRole(role)}>
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    icon={Trash2}
                    isLoading={deletingId === role.id}
                    onClick={() => handleDelete(role)}
                  >
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
