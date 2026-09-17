import { useEffect, useState } from "react";
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

      <div>
        <h2 className="mb-2 font-semibold text-slate-700">Tareas por usuario</h2>
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
