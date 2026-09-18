import { apiFetch } from "./httpClient";

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ProjectLookupDto {
  id: string;
  name: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name: string;
  description?: string;
  isActive: boolean;
}

export function listProjects() {
  return apiFetch<ProjectDto[]>("/api/projects");
}

// No requiere el permiso Tasks:Read — cualquier usuario que pueda crear/editar una
// tarea necesita esta lista mínima para el selector "Proyecto" (ver ProjectsController.GetActive).
export function listActiveProjects() {
  return apiFetch<ProjectLookupDto[]>("/api/projects/lookup");
}

export function createProject(input: CreateProjectInput) {
  return apiFetch<ProjectDto>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProject(id: string, input: UpdateProjectInput) {
  return apiFetch<ProjectDto>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string) {
  return apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" });
}
