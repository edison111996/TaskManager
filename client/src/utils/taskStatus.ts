import type { TaskStatus } from "../api/tasks";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  Pending: "Pendiente",
  InProgress: "En progreso",
  Done: "Completada",
};

export const STATUS_TONES: Record<TaskStatus, "slate" | "blue" | "green"> = {
  Pending: "slate",
  InProgress: "blue",
  Done: "green",
};
