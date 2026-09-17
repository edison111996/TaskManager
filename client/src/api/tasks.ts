import { apiFetch } from "./httpClient";

export interface TaskUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type TaskStatus = "Pending" | "InProgress" | "Done";

export interface TaskItemDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  assignedTo: TaskUserDto;
  createdBy: TaskUserDto;
  commentCount: number;
  createdAt: string;
}

export interface TaskCommentDto {
  id: string;
  text: string;
  author: TaskUserDto;
  createdAt: string;
}

export interface TaskStatusHistoryDto {
  id: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  changedBy: TaskUserDto;
  createdAt: string;
}

export interface TaskItemDetailDto extends Omit<TaskItemDto, "commentCount"> {
  comments: TaskCommentDto[];
  statusHistory: TaskStatusHistoryDto[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  startDate?: string | null;
  dueDate?: string | null;
  assignedToUserId: string;
}

export interface UpdateTaskInput {
  title: string;
  description?: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: TaskStatus;
  assignedToUserId: string;
}

export function listTasks() {
  return apiFetch<TaskItemDto[]>("/api/tasks");
}

export function getTask(id: string) {
  return apiFetch<TaskItemDetailDto>(`/api/tasks/${id}`);
}

export function createTask(input: CreateTaskInput) {
  return apiFetch<TaskItemDto>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTask(id: string, input: UpdateTaskInput) {
  return apiFetch<TaskItemDto>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: string) {
  return apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

export function addComment(taskId: string, text: string) {
  return apiFetch<TaskItemDetailDto>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
