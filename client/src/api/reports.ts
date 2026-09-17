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

export interface TrendPointDto {
  periodLabel: string;
  created: number;
  completed: number;
}

export interface TasksSummaryDto {
  total: number;
  byStatus: StatusCountDto[];
  byUser: UserTaskCountDto[];
  trend: TrendPointDto[];
}

export function getTasksSummary() {
  return apiFetch<TasksSummaryDto>("/api/reports/tasks-summary");
}
