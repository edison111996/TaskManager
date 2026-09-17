import { useEffect, useState } from "react";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { listUsers, deleteUser, type UserDto } from "../api/users";
import { listRoles, type RoleDto } from "../api/roles";
import { UserFormModal } from "./UserFormModal";

export function UsersPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("Users:Create");
  const canEdit = hasPermission("Users:Edit");
  const canDelete = hasPermission("Users:Delete");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadUsers() {
    listUsers()
      .then(setUsers)
      .catch(() => setError("No se pudo cargar la lista de usuarios."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadUsers();
    listRoles().then(setRoles).catch(() => undefined);
  }, []);

  async function handleDelete(user: UserDto) {
    if (!confirm(`¿Eliminar a ${user.firstName} ${user.lastName}?`)) return;
    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      showToast("Usuario eliminado", "success");
      loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar el usuario.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // El usuario solo trae nombres de rol (roles: string[]); para el formulario
  // de edición necesitamos los IDs, así que los buscamos por nombre en `roles`.
  function editingUserWithRoleIds(user: UserDto) {
    const roleIds = roles.filter((r) => user.roles.includes(r.name)).map((r) => r.id);
    return { ...user, roleIds };
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        {canCreate && <Button onClick={() => setIsCreating(true)}>+ Nuevo usuario</Button>}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Table
        rows={users}
        getRowKey={(u) => u.id}
        columns={[
          { header: "Nombre", render: (u) => `${u.firstName} ${u.lastName}` },
          { header: "Correo", render: (u) => u.email },
          { header: "Teléfono", render: (u) => u.phone ?? "—" },
          {
            header: "Roles",
            render: (u) => (
              <div className="flex flex-wrap gap-1">
                {u.roles.map((role) => (
                  <Badge key={role} tone="blue">
                    {role}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            header: "Estado",
            render: (u) => <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Activo" : "Inactivo"}</Badge>,
          },
          ...(canEdit || canDelete
            ? [
                {
                  header: "",
                  render: (u: UserDto) => (
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button variant="secondary" onClick={() => setEditingUser(u)}>
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="danger" isLoading={deletingId === u.id} onClick={() => handleDelete(u)}>
                          Eliminar
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />

      {isCreating && (
        <UserFormModal roles={roles} onClose={() => setIsCreating(false)} onSaved={loadUsers} />
      )}

      {editingUser && canEdit && (
        <UserFormModal
          roles={roles}
          editingUser={editingUserWithRoleIds(editingUser)}
          onClose={() => setEditingUser(null)}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
}
