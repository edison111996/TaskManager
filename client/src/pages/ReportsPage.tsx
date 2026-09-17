import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getTasksSummary, type TasksSummaryDto } from "../api/reports";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { LoadingState } from "../components/LoadingState";
import { STATUS_LABELS, STATUS_TONES } from "../utils/taskStatus";
import type { TaskStatus } from "../api/tasks";

// Tailwind necesita ver la clase completa como texto literal en el código para generarla;
// "text-" + tone + "-600" interpolado no funciona, por eso el mapa explícito.
const NUMBER_COLOR_CLASSES: Record<string, string> = {
  slate: "text-slate-600",
  blue: "text-blue-600",
  green: "text-green-600",
};

// Los mismos "hue" que usa el resto de la app para cada estado (Badge/STATUS_TONES),
// pero en su versión más saturada porque acá pintan una barra sólida, no un fondo
// pastel de badge. InProgress y Done reutilizan el mismo azul/verde de la tendencia
// a propósito: es el mismo estado, tiene que verse igual en los dos gráficos.
const STATUS_COLORS: Record<TaskStatus, string> = {
  Pending: "#64748b",
  InProgress: "#2563eb",
  Done: "#16a34a",
};

const USER_BAR_COLOR = "#2563eb";
const TREND_COLORS = { created: "#2563eb", completed: "#16a34a" };

export function ReportsPage() {
  const [summary, setSummary] = useState<TasksSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTasksSummary()
      .then(setSummary)
      .catch(() => setError("No se pudo cargar el informe."));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!summary) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Informes</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total de tareas</p>
          <p className="text-3xl font-bold text-slate-800">{summary.total}</p>
        </Card>
        {summary.byStatus.map((item) => (
          <Card key={item.status}>
            <p className="text-sm text-slate-500">{STATUS_LABELS[item.status as TaskStatus] ?? item.status}</p>
            <p className={`text-3xl font-bold ${NUMBER_COLOR_CLASSES[STATUS_TONES[item.status as TaskStatus]]}`}>
              {item.count}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Tareas por estado</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={summary.byStatus} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="status"
                tickFormatter={(status: string) => STATUS_LABELS[status as TaskStatus] ?? status}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                formatter={(value) => [String(value), "Tareas"]}
                labelFormatter={(status) => STATUS_LABELS[status as TaskStatus] ?? String(status)}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {summary.byStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status as TaskStatus] ?? "#94a3b8"} />
                ))}
                <LabelList dataKey="count" position="top" fill="#334155" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Tareas por usuario</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={summary.byUser}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="userName"
                width={110}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(value) => [String(value), "Tareas"]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} fill={USER_BAR_COLOR}>
                <LabelList dataKey="count" position="right" fill="#334155" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-700">Tendencia (últimas 8 semanas)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={summary.trend} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="periodLabel" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend
              formatter={(value) => (value === "created" ? "Creadas" : "Completadas")}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="created"
              name="created"
              stroke={TREND_COLORS.created}
              strokeWidth={2}
              dot={{ r: 4, fill: TREND_COLORS.created, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="completed"
              stroke={TREND_COLORS.completed}
              strokeWidth={2}
              dot={{ r: 4, fill: TREND_COLORS.completed, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div>
        <h2 className="mb-2 font-semibold text-slate-700">Tareas por usuario (detalle)</h2>
        <Table
          rows={summary.byUser}
          getRowKey={(u) => u.userId}
          columns={[
            { header: "Usuario", render: (u) => u.userName },
            { header: "Cantidad de tareas", render: (u) => u.count },
          ]}
        />
      </div>
    </div>
  );
}
