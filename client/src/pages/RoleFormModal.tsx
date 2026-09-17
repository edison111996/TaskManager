import { useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useToast } from "../components/ToastProvider";
import { createRole, updateRole, assignRolePermissions, type RoleDto } from "../api/roles";
import type { ModuleDto } from "../api/modules";
import { ACTION_LABELS } from "../utils/permissionAction";

interface RoleFormModalProps {
  modules: ModuleDto[];
  editingRole?: RoleDto;
  onClose: () => void;
  onSaved: () => void;
}

// El RoleDto solo trae códigos de permiso ("Users:Read"), no sus IDs; para las
// casillas necesitamos el ID real, así que lo buscamos en el catálogo de módulos.
function resolvePermissionIds(editingRole: RoleDto | undefined, modules: ModuleDto[]): string[] {
  if (!editingRole) return [];
  const codes = new Set(editingRole.permissions);
  return modules.flatMap((m) => m.permissions.filter((p) => codes.has(p.code)).map((p) => p.id));
}

export function RoleFormModal({ modules, editingRole, onClose, onSaved }: RoleFormModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(editingRole);

  const [name, setName] = useState(editingRole?.name ?? "");
  const [description, setDescription] = useState(editingRole?.description ?? "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    resolvePermissionIds(editingRole, modules),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId) ? current.filter((id) => id !== permissionId) : [...current, permissionId],
    );
  }

  function toggleModuleAll(module: ModuleDto, checked: boolean) {
    const modulePermissionIds = module.permissions.map((p) => p.id);
    setSelectedPermissionIds((current) =>
      checked
        ? [...new Set([...current, ...modulePermissionIds])]
        : current.filter((id) => !modulePermissionIds.includes(id)),
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditing && editingRole) {
        await updateRole(editingRole.id, { name, description: description || undefined });
        await assignRolePermissions(editingRole.id, selectedPermissionIds);
      } else {
        await createRole({ name, description: description || undefined, permissionIds: selectedPermissionIds });
      }
      showToast(isEditing ? "Rol actualizado" : "Rol creado", "success");
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el rol.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar rol" : "Nuevo rol"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <span className="text-sm font-medium text-slate-600">Permisos por módulo</span>
          <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {modules.map((module) => {
              const modulePermissionIds = module.permissions.map((p) => p.id);
              const allChecked = modulePermissionIds.every((id) => selectedPermissionIds.includes(id));

              return (
                <div key={module.id}>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleModuleAll(module, e.target.checked)}
                    />
                    {module.name}
                  </label>
                  <div className="ml-6 mt-1 flex flex-wrap gap-3">
                    {module.permissions.map((permission) => (
                      <label key={permission.id} className="flex items-center gap-1.5 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                        />
                        {ACTION_LABELS[permission.action] ?? permission.action}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
