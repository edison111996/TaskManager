import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, History, MessageSquare, SendHorizontal } from "lucide-react";
import { getTask, addComment, type TaskItemDetailDto } from "../api/tasks";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";

export function TaskDetailPage() {
  // useParams lee el ":id" de la ruta "/tasks/:id" definida en App.tsx
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const [task, setTask] = useState<TaskItemDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadTask() {
    if (!id) return;
    getTask(id)
      .then(setTask)
      .catch(() => setError("No se pudo cargar la tarea."));
  }

  useEffect(loadTask, [id]);

  async function handleAddComment(event: FormEvent) {
    event.preventDefault();
    if (!id || !commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await addComment(id, commentText.trim());
      setTask(updated);
      setCommentText("");
      showToast("Comentario agregado", "success");
    } catch {
      showToast("No se pudo agregar el comentario.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!task) return <LoadingState />;

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/tasks" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
        <ArrowLeft size={15} />
        Volver a tareas
      </Link>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800">{task.title}</h1>
          <StatusBadge status={task.status} />
        </div>
        {task.description && <p className="mb-3 text-slate-600">{task.description}</p>}
        <dl className="grid grid-cols-2 gap-2 text-sm text-slate-500">
          <div>
            <dt className="font-medium text-slate-600">Proyecto</dt>
            <dd>{task.project?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Asignado a</dt>
            <dd>
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Creado por</dt>
            <dd>
              {task.createdBy.firstName} {task.createdBy.lastName}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Fecha inicio</dt>
            <dd>{task.startDate ? new Date(task.startDate).toLocaleDateString() : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Fecha límite</dt>
            <dd>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold text-slate-700">
          <History size={16} className="text-slate-400" />
          Historial de estado
        </h2>
        <div className="space-y-2">
          {task.statusHistory.map((entry) => (
            <Card key={entry.id}>
              <p className="text-sm text-slate-700">
                {entry.fromStatus ? (
                  <>
                    <StatusBadge status={entry.fromStatus} />
                    {" → "}
                  </>
                ) : (
                  "Creada como "
                )}
                <StatusBadge status={entry.toStatus} />
              </p>
              {entry.comment && <p className="mt-1 text-sm text-slate-600">"{entry.comment}"</p>}
              <p className="mt-1 text-xs text-slate-400">
                {entry.changedBy.firstName} {entry.changedBy.lastName} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold text-slate-700">
          <MessageSquare size={16} className="text-slate-400" />
          Comentarios ({task.comments.length})
        </h2>
        <div className="space-y-2">
          {task.comments.map((comment) => (
            <Card key={comment.id}>
              <p className="text-sm text-slate-700">{comment.text}</p>
              <p className="mt-1 text-xs text-slate-400">
                {comment.author.firstName} {comment.author.lastName} ·{" "}
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {hasPermission("Tasks:Edit") && (
          <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <Button type="submit" icon={SendHorizontal} isLoading={isSubmitting} disabled={!commentText.trim()}>
              Comentar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
