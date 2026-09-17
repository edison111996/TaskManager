import { apiFetch } from "./httpClient";

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name: string;
  description?: string;
}

export function listRoles() {
  return apiFetch<RoleDto[]>("/api/roles");
}

export function createRole(input: CreateRoleInput) {
  return apiFetch<RoleDto>("/api/roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRole(id: string, input: UpdateRoleInput) {
  return apiFetch<RoleDto>(`/api/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteRole(id: string) {
  return apiFetch<void>(`/api/roles/${id}`, { method: "DELETE" });
}

export function assignRolePermissions(id: string, permissionIds: string[]) {
  return apiFetch<RoleDto>(`/api/roles/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}
