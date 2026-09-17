import { useEffect, useState } from "react";
import { listModules, deleteModule, type ModuleDto } from "../api/modules";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { ACTION_LABELS } from "../utils/permissionAction";
import { useAuth } from "../auth/AuthContext";
import { ModuleFormModal } from "./ModuleFormModal";

export function ModulesPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("Modules:Create");
  const canEdit = hasPermission("Modules:Edit");
  const canDelete = hasPermission("Modules:Delete");
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<ModuleDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadModules() {
    listModules()
      .then(setModules)
      .catch(() => setError("No se pudo cargar la lista de módulos."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadModules, []);

  async function handleDelete(module: ModuleDto) {
    if (!confirm(`¿Eliminar el módulo "${module.name}"? Esto también elimina sus permisos.`)) return;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Módulos</h1>
        {canCreate && <Button onClick={() => setIsCreating(true)}>+ Nuevo módulo</Button>}
      </div>

      {error && <p className="text-red-600">{error}</p>}

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
                  <Button variant="secondary" onClick={() => setEditingModule(module)}>
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" isLoading={deletingId === module.id} onClick={() => handleDelete(module)}>
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
