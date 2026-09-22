import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TaskItemDto } from "../api/tasks";
import { StatusBadge } from "./StatusBadge";
import { STATUS_BORDER_CLASSES } from "../utils/taskStatus";
import { addDays, formatDateKey, getMonthGridDays, getWeekDays, isSameDay, isoDateKey } from "../utils/calendar";

type ViewMode = "day" | "week" | "month";
type TasksByDay = Map<string, TaskItemDto[]>;

const VIEW_LABELS: Record<ViewMode, string> = { day: "Día", week: "Semana", month: "Mes" };
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface TaskCalendarViewProps {
  tasks: TaskItemDto[];
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Agrupa las tareas por día una sola vez (no en cada render de cada celda). Una
  // tarea sin dueDate ni startDate no tiene dónde ubicarse en el calendario, se ignora.
  const tasksByDay = useMemo(() => {
    const map: TasksByDay = new Map();
    for (const task of tasks) {
      const dateSource = task.dueDate ?? task.startDate;
      if (!dateSource) continue;
      const key = isoDateKey(dateSource);
      const existing = map.get(key);
      if (existing) existing.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  function goToday() {
    setCurrentDate(new Date());
  }

  function goPrev() {
    if (viewMode === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else if (viewMode === "week") setCurrentDate((d) => addDays(d, -7));
    else setCurrentDate((d) => addDays(d, -1));
  }

  function goNext() {
    if (viewMode === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else if (viewMode === "week") setCurrentDate((d) => addDays(d, 7));
    else setCurrentDate((d) => addDays(d, 1));
  }

  const headerLabel =
    viewMode === "day"
      ? currentDate.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
      : currentDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goPrev} aria-label="Anterior" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToday}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Hoy
          </button>
          <button onClick={goNext} aria-label="Siguiente" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <ChevronRight size={18} />
          </button>
          <span className="ml-1 font-medium capitalize text-slate-700">{headerLabel}</span>
        </div>

        <div className="flex rounded-lg border border-slate-300 p-0.5">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === mode ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "month" && <MonthGrid currentDate={currentDate} tasksByDay={tasksByDay} />}
      {viewMode === "week" && <WeekGrid currentDate={currentDate} tasksByDay={tasksByDay} />}
      {viewMode === "day" && <DayList currentDate={currentDate} tasksByDay={tasksByDay} />}
    </div>
  );
}

function TaskChip({ task }: { task: TaskItemDto }) {
  return (
    <Link
      to={`/tasks/${task.id}`}
      className={`block truncate rounded border-l-4 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${STATUS_BORDER_CLASSES[task.status]}`}
    >
      {task.title}
    </Link>
  );
}

function DayCell({ date, isMuted, tasks }: { date: Date; isMuted: boolean; tasks: TaskItemDto[] }) {
  const isToday = isSameDay(date, new Date());

  return (
    <div className={`min-h-28 rounded-lg border border-slate-100 p-1.5 ${isMuted ? "bg-slate-50" : "bg-white"}`}>
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
          isToday ? "bg-blue-600 text-white" : isMuted ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {date.getDate()}
      </span>
      <div className="mt-1 space-y-1">
        {tasks.map((task) => (
          <TaskChip key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ currentDate, tasksByDay }: { currentDate: Date; tasksByDay: TasksByDay }) {
  const days = getMonthGridDays(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-7 bg-slate-100 text-center text-xs font-semibold text-slate-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {days.map((date) => (
          <DayCell
            key={formatDateKey(date)}
            date={date}
            isMuted={date.getMonth() !== currentDate.getMonth()}
            tasks={tasksByDay.get(formatDateKey(date)) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function WeekGrid({ currentDate, tasksByDay }: { currentDate: Date; tasksByDay: TasksByDay }) {
  const days = getWeekDays(currentDate);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-7 bg-slate-100 text-center text-xs font-semibold text-slate-500">
        {days.map((date) => (
          <div key={formatDateKey(date)} className="py-2">
            {WEEKDAY_LABELS[(date.getDay() + 6) % 7]} {date.getDate()}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {days.map((date) => (
          <DayCell
            key={formatDateKey(date)}
            date={date}
            isMuted={false}
            tasks={tasksByDay.get(formatDateKey(date)) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function DayList({ currentDate, tasksByDay }: { currentDate: Date; tasksByDay: TasksByDay }) {
  const tasks = tasksByDay.get(formatDateKey(currentDate)) ?? [];

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        Sin tareas para este día.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Link
          key={task.id}
          to={`/tasks/${task.id}`}
          className={`flex items-center justify-between rounded-xl border border-l-4 border-slate-200 bg-white p-4 hover:border-blue-300 ${STATUS_BORDER_CLASSES[task.status]}`}
        >
          <span className="font-medium text-slate-700">{task.title}</span>
          <StatusBadge status={task.status} />
        </Link>
      ))}
    </div>
  );
}
