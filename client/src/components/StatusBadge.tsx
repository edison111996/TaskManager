import type { TaskStatus } from "../api/tasks";
import { STATUS_LABELS } from "../utils/taskStatus";

// A diferencia de <Badge tone="slate|blue|green"> (pastel, para contexto secundario),
// este usa fondo sólido — el estado de una tarea es el dato más importante de la
// fila/tarjeta y necesita leerse de un vistazo, no competir con el resto en pastel.
const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  Pending: "bg-slate-500 text-white",
  InProgress: "bg-blue-600 text-white",
  Done: "bg-green-600 text-white",
};

export function StatusBadge({ status, className = "" }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
