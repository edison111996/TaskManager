import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { listModules, deleteModule, type ModuleDto } from "../api/modules";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../components/ToastProvider";
import { useConfirm } from "../components/ConfirmProvider";
import { ACTION_LABELS } from "../utils/permissionAction";
import { useAuth } from "../auth/AuthContext";
import { ModuleFormModal } from "./ModuleFormModal";

export function ModulesPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("Modules:Create");
  const canEdit = hasPermission("Modules:Edit");
  const canDelete = hasPermission("Modules:Delete");
  const { data: modules = [], isLoading, error, reload: loadModules, retry } = useFetch(
    listModules,
    "No se pudo cargar la lista de módulos.",
  );
  const [editingModule, setEditingModule] = useState<ModuleDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(module: ModuleDto) {
    if (!(await confirm({ message: `¿Eliminar el módulo "${module.name}"? Esto también elimina sus permisos.` }))) return;
    setDeletingId(module.id);
    try {
      await deleteModule(module.id);
      showToast("Módulo eliminado", "success");
      loadModules();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar el módulo.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <LoadingState />;
  if (error && modules.length === 0) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Módulos</h1>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsCreating(true)}>
            Nuevo módulo
          </Button>
        )}
      </div>

      {modules.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Todavía no hay módulos. Creá el primero con el botón de arriba.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.id}>
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-800">{module.name}</h2>
                <Badge>{module.code}</Badge>
              </div>
              <div className="flex shrink-0 gap-2">
                {canEdit && (
                  <Button variant="secondary" icon={Pencil} onClick={() => setEditingModule(module)}>
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    icon={Trash2}
                    isLoading={deletingId === module.id}
                    onClick={() => handleDelete(module)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
            {module.description && <p className="mb-3 text-sm text-slate-500">{module.description}</p>}
            <div className="flex flex-wrap gap-1">
              {module.permissions.map((permission) => (
                <Badge key={permission.id} tone="blue">
                  {ACTION_LABELS[permission.action] ?? permission.action}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {isCreating && <ModuleFormModal onClose={() => setIsCreating(false)} onSaved={loadModules} />}

      {editingModule && canEdit && (
        <ModuleFormModal
          editingModule={editingModule}
          onClose={() => setEditingModule(null)}
          onSaved={loadModules}
        />
      )}
    </div>
  );
}
