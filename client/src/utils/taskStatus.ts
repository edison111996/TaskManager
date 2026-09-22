import type { TaskStatus } from "../api/tasks";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  Pending: "Pendiente",
  InProgress: "En progreso",
  Done: "Completada",
};

// Se mantienen para lo que ya usa <Badge tone={...}> (pastel, subtil — bien para
// contextos donde el color es secundario). Para el estado como protagonista
// (Kanban, calendario, StatusBadge) se usan los mapas de abajo, más saturados.
export const STATUS_TONES: Record<TaskStatus, "slate" | "blue" | "green"> = {
  Pending: "slate",
  InProgress: "blue",
  Done: "green",
};

// Acento sólido — borde izquierdo en tarjetas de Kanban y chips de calendario.
export const STATUS_BORDER_CLASSES: Record<TaskStatus, string> = {
  Pending: "border-l-slate-400",
  InProgress: "border-l-blue-500",
  Done: "border-l-green-500",
};

// Fondo tenue por columna del Kanban — para que cada columna tenga identidad
// propia aunque esté vacía, no solo sus tarjetas.
export const STATUS_COLUMN_BG_CLASSES: Record<TaskStatus, string> = {
  Pending: "bg-slate-50",
  InProgress: "bg-blue-50/60",
  Done: "bg-green-50/60",
};
