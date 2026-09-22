import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Loader2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingState } from "../components/LoadingState";
import { getTasksSummary, type TasksSummaryDto } from "../api/reports";
import { listTasks, type TaskItemDto } from "../api/tasks";

const STAT_TILES: {
  key: "total" | "Pending" | "InProgress" | "Done";
  label: string;
  icon: typeof ListTodo;
  iconClass: string;
}[] = [
  { key: "total", label: "Total de tareas", icon: ListTodo, iconClass: "bg-slate-100 text-slate-600" },
  { key: "Pending", label: "Pendientes", icon: Clock, iconClass: "bg-slate-100 text-slate-600" },
  { key: "InProgress", label: "En progreso", icon: Loader2, iconClass: "bg-blue-100 text-blue-600" },
  { key: "Done", label: "Completadas", icon: CheckCircle2, iconClass: "bg-green-100 text-green-600" },
];

const QUICK_LINKS = [
  { to: "/tasks", label: "Ver tareas", icon: ListTodo },
  { to: "/tasks", label: "Tablero Kanban", icon: FolderKanban },
  { to: "/projects", label: "Proyectos", icon: Calendar },
  { to: "/reports", label: "Informes", icon: BarChart3 },
];

export function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const canReadTasks = hasPermission("Tasks:Read");

  const [summary, setSummary] = useState<TasksSummaryDto | null>(null);
  const [myTasks, setMyTasks] = useState<TaskItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(canReadTasks);

  useEffect(() => {
    if (!canReadTasks || !user) return;

    Promise.all([getTasksSummary(), listTasks()])
      .then(([summaryResult, tasks]) => {
        setSummary(summaryResult);
        setMyTasks(tasks.filter((t) => t.assignedTo.id === user.id && t.status !== "Done").slice(0, 5));
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [canReadTasks, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hola, {user?.firstName} 👋</h1>
        <p className="text-slate-500">Esto es lo que tenés pendiente hoy.</p>
      </div>

      {canReadTasks && isLoading && <LoadingState />}

      {canReadTasks && !isLoading && summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_TILES.map(({ key, label, icon: Icon, iconClass }) => {
            const value = key === "total" ? summary.total : (summary.byStatus.find((s) => s.status === key)?.count ?? 0);
            return (
              <Card key={key} className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {canReadTasks && !isLoading && (
          <Card className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Tus tareas activas</h2>
              <Link to="/tasks" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>
            {myTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No tenés tareas activas asignadas. 🎉</p>
            ) : (
              <div className="space-y-2">
                {myTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <span className="text-sm font-medium text-slate-700">{task.title}</span>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Accesos rápidos</h2>
          <div className="space-y-1.5">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <Icon size={16} className="text-slate-400" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {user && user.roles.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold text-slate-700">Tus roles</h2>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role} tone="blue">
                {role}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
