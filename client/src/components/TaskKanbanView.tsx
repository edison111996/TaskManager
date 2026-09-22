import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { updateTask, type TaskItemDto, type TaskStatus } from "../api/tasks";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { STATUS_BORDER_CLASSES, STATUS_COLUMN_BG_CLASSES, STATUS_LABELS } from "../utils/taskStatus";

const STATUSES: TaskStatus[] = ["Pending", "InProgress", "Done"];

interface TaskKanbanViewProps {
  tasks: TaskItemDto[];
  onTaskUpdated: () => void;
}

interface PendingChange {
  task: TaskItemDto;
  newStatus: TaskStatus;
}

export function TaskKanbanView({ tasks, onTaskUpdated }: TaskKanbanViewProps) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("Tasks:Edit");
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  // Sin esto, dnd-kit interpreta CUALQUIER click como el inicio de un drag y se come
  // el click del <Link> de la tarjeta — con 8px de umbral, un click normal (sin
  // movimiento) navega, y solo arrastrar de verdad dispara el drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;
    setPendingChange({ task, newStatus });
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 sm:grid-cols-3">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              draggable={canEdit}
            />
          ))}
        </div>
      </DndContext>

      {pendingChange && (
        <StatusChangeModal
          pendingChange={pendingChange}
          onClose={() => setPendingChange(null)}
          onSaved={() => {
            setPendingChange(null);
            onTaskUpdated();
          }}
        />
      )}
    </>
  );
}

function KanbanColumn({
  status,
  tasks,
  draggable,
}: {
  status: TaskStatus;
  tasks: TaskItemDto[];
  draggable: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-80 flex-col rounded-xl border p-3 transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : `border-slate-200 ${STATUS_COLUMN_BG_CLASSES[status]}`
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">{STATUS_LABELS[status]}</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} draggable={draggable} />
        ))}
        {tasks.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Sin tareas</p>}
      </div>
    </div>
  );
}

function KanbanCard({ task, draggable }: { task: TaskItemDto; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      className={`rounded-lg border border-l-4 border-slate-200 bg-white p-3 shadow-sm ${STATUS_BORDER_CLASSES[task.status]} ${
        draggable ? "cursor-grab touch-none active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-50 shadow-md" : ""}`}
    >
      <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
        {task.title}
      </Link>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <StatusBadge status={task.status} />
        {task.project && (
          <Badge tone="blue" className="text-[10px]">
            {task.project.name}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {task.assignedTo.firstName} {task.assignedTo.lastName}
      </p>
      {task.dueDate && (
        <p className="mt-1 text-xs text-slate-400">Vence {new Date(task.dueDate).toLocaleDateString()}</p>
      )}
    </div>
  );
}

function StatusChangeModal({
  pendingChange,
  onClose,
  onSaved,
}: {
  pendingChange: PendingChange;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { task, newStatus } = pendingChange;

  async function handleConfirm() {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description ?? undefined,
        startDate: task.startDate,
        dueDate: task.dueDate,
        projectId: task.project?.id ?? null,
        assignedToUserId: task.assignedTo.id,
        status: newStatus,
        statusChangeComment: comment.trim(),
      });
      showToast("Estado actualizado", "success");
      onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo cambiar el estado.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Mover a "${STATUS_LABELS[newStatus]}"`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          "{task.title}": {STATUS_LABELS[task.status]} → {STATUS_LABELS[newStatus]}
        </p>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">¿Por qué cambia de estado?</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Justificá el cambio — queda en el historial de seguimiento de la tarea."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" isLoading={isSubmitting} disabled={!comment.trim()} onClick={handleConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
