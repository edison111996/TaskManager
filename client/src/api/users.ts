import { apiFetch } from "./httpClient";

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roles: string[];
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  roleIds: string[];
}

export interface UpdateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
}

export interface UserLookupDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function listUsers() {
  return apiFetch<UserDto[]>("/api/users");
}

// No requiere el permiso Users:Read — cualquier usuario logueado puede pedir esta
// lista mínima para elegir a quién asignar algo (ver UsersController.GetAssignable).
export function listAssignableUsers() {
  return apiFetch<UserLookupDto[]>("/api/users/lookup");
}

export function createUser(input: CreateUserInput) {
  return apiFetch<UserDto>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UpdateUserInput) {
  return apiFetch<UserDto>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return apiFetch<void>(`/api/users/${id}`, { method: "DELETE" });
}

export function assignUserRoles(id: string, roleIds: string[]) {
  return apiFetch<UserDto>(`/api/users/${id}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  });
}
