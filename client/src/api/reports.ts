import { apiFetch } from "./httpClient";

export interface StatusCountDto {
  status: string;
  count: number;
}

export interface UserTaskCountDto {
  userId: string;
  userName: string;
  count: number;
}

export interface TasksSummaryDto {
  total: number;
  byStatus: StatusCountDto[];
  byUser: UserTaskCountDto[];
}

export function getTasksSummary() {
  return apiFetch<TasksSummaryDto>("/api/reports/tasks-summary");
}
