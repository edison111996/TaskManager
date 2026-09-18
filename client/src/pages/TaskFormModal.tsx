import { useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { createTask, updateTask, type TaskItemDto, type TaskStatus } from "../api/tasks";
import type { UserLookupDto } from "../api/users";
import type { ProjectLookupDto } from "../api/projects";
import { STATUS_LABELS } from "../utils/taskStatus";
import { useToast } from "../components/ToastProvider";

interface TaskFormModalProps {
  users: UserLookupDto[];
  projects: ProjectLookupDto[];
  editingTask?: TaskItemDto;
  onClose: () => void;
  onSaved: () => void;
}

function toDateInputValue(isoDate: string | null): string {
  return isoDate ? isoDate.slice(0, 10) : "";
}

// Comparación de strings alcanza: los inputs type="date" devuelven "YYYY-MM-DD",
// que ordena igual alfabéticamente que cronológicamente — no hace falta parsear Date.
function validateDates(startDate: string, dueDate: string): string | undefined {
  if (!startDate || !dueDate) return undefined;
  if (startDate > dueDate) return "La fecha de inicio no puede ser posterior a la fecha límite.";
  return undefined;
}

export function TaskFormModal({ users, projects, editingTask, onClose, onSaved }: TaskFormModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(editingTask);

  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [description, setDescription] = useState(editingTask?.description ?? "");
  const [startDate, setStartDate] = useState(toDateInputValue(editingTask?.startDate ?? null));
  const [dueDate, setDueDate] = useState(toDateInputValue(editingTask?.dueDate ?? null));
  const [dateError, setDateError] = useState<string | undefined>(() => validateDates(startDate, dueDate));
  const [assignedToUserId, setAssignedToUserId] = useState(editingTask?.assignedTo.id ?? users[0]?.id ?? "");
  const [projectId, setProjectId] = useState(editingTask?.project?.id ?? "");
  const [status, setStatus] = useState<TaskStatus>(editingTask?.status ?? "Pending");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Un <input type="date"> solo dispara onChange cuando ya se eligió una fecha completa
  // (no tecla por tecla como un input de texto), así que acá sí conviene validar al toque
  // en vez de esperar a un blur.
  function handleStartDateChange(value: string) {
    setStartDate(value);
    setDateError(validateDates(value, dueDate));
  }

  function handleDueDateChange(value: string) {
    setDueDate(value);
    setDateError(validateDates(startDate, value));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        projectId: projectId || null,
        assignedToUserId,
      };

      if (isEditing && editingTask) {
        await updateTask(editingTask.id, { ...payload, status });
      } else {
        await createTask(payload);
      }
      showToast(isEditing ? "Tarea actualizada" : "Tarea creada", "success");
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la tarea.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar tarea" : "Nueva tarea"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        <Input
          label="Fecha inicio"
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
        />

        <Input
          label="Fecha límite"
          type="date"
          value={dueDate}
          onChange={(e) => handleDueDateChange(e.target.value)}
          error={dateError}
        />

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">Proyecto</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">— Sin proyecto —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">Asignado a</span>
          <select
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </label>

        {isEditing && (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-600">Estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!!dateError}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
