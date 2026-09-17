import { apiFetch } from "./httpClient";

export interface PermissionDto {
  id: string;
  action: string;
  code: string;
}

export interface ModuleDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  permissions: PermissionDto[];
}

export interface CreateModuleInput {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateModuleInput {
  name: string;
  description?: string;
}

export function listModules() {
  return apiFetch<ModuleDto[]>("/api/modules");
}

export function createModule(input: CreateModuleInput) {
  return apiFetch<ModuleDto>("/api/modules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateModule(id: string, input: UpdateModuleInput) {
  return apiFetch<ModuleDto>(`/api/modules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteModule(id: string) {
  return apiFetch<void>(`/api/modules/${id}`, { method: "DELETE" });
}
