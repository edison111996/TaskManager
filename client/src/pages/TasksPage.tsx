import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { listTasks, deleteTask, exportTasksPdf, type TaskItemDto } from "../api/tasks";
import { listAssignableUsers, type UserLookupDto } from "../api/users";
import { STATUS_LABELS, STATUS_TONES } from "../utils/taskStatus";
import { TaskFormModal } from "./TaskFormModal";
import { TaskCalendarView } from "../components/TaskCalendarView";

type ViewMode = "list" | "calendar";

export function TasksPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const [tasks, setTasks] = useState<TaskItemDto[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItemDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isExporting, setIsExporting] = useState(false);

  const canCreate = hasPermission("Tasks:Create");
  const canEdit = hasPermission("Tasks:Edit");
  const canDelete = hasPermission("Tasks:Delete");

  function loadTasks() {
    listTasks()
      .then(setTasks)
      .catch(() => setError("No se pudo cargar la lista de tareas."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadTasks();
    listAssignableUsers().then(setUsers).catch(() => undefined);
  }, []);

  async function handleDelete(task: TaskItemDto) {
    if (!confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
    setDeletingId(task.id);
    try {
      await deleteTask(task.id);
      showToast("Tarea eliminada", "success");
      loadTasks();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar la tarea.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExportPdf() {
    setIsExporting(true);
    try {
      const blob = await exportTasksPdf();
      // El navegador no deja "descargar" un blob directo: hay que armar una URL
      // temporal, disparar el click de un <a> invisible, y liberar la URL después.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tareas.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo exportar el PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Tareas</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            {(["list", "calendar"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  viewMode === mode ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {mode === "list" ? "Lista" : "Calendario"}
              </button>
            ))}
          </div>
          {viewMode === "list" && (
            <Button variant="secondary" isLoading={isExporting} onClick={handleExportPdf}>
              Exportar PDF
            </Button>
          )}
          {canCreate && <Button onClick={() => setIsCreating(true)}>+ Nueva tarea</Button>}
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {viewMode === "list" ? (
        <Table
          rows={tasks}
          getRowKey={(t) => t.id}
          columns={[
            {
              header: "Título",
              render: (t) => (
                <Link to={`/tasks/${t.id}`} className="font-medium text-blue-600 hover:underline">
                  {t.title}
                </Link>
              ),
            },
            {
              header: "Estado",
              render: (t) => <Badge tone={STATUS_TONES[t.status]}>{STATUS_LABELS[t.status]}</Badge>,
            },
            { header: "Asignado a", render: (t) => `${t.assignedTo.firstName} ${t.assignedTo.lastName}` },
            {
              header: "Fecha límite",
              render: (t) => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"),
            },
            { header: "Comentarios", render: (t) => t.commentCount },
            ...(canEdit || canDelete
              ? [
                  {
                    header: "",
                    render: (t: TaskItemDto) => (
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button variant="secondary" onClick={() => setEditingTask(t)}>
                            Editar
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="danger" isLoading={deletingId === t.id} onClick={() => handleDelete(t)}>
                            Eliminar
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      ) : (
        <TaskCalendarView tasks={tasks} />
      )}

      {isCreating && <TaskFormModal users={users} onClose={() => setIsCreating(false)} onSaved={loadTasks} />}

      {editingTask && canEdit && (
        <TaskFormModal
          users={users}
          editingTask={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={loadTasks}
        />
      )}
    </div>
  );
}
