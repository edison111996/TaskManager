import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { listTasks, deleteTask, type TaskItemDto } from "../api/tasks";
import { listAssignableUsers, type UserLookupDto } from "../api/users";
import { STATUS_LABELS, STATUS_TONES } from "../utils/taskStatus";
import { TaskFormModal } from "./TaskFormModal";

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

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tareas</h1>
        {canCreate && <Button onClick={() => setIsCreating(true)}>+ Nueva tarea</Button>}
      </div>

      {error && <p className="text-red-600">{error}</p>}

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
