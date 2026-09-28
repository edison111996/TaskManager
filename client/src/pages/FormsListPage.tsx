import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { listPublishedForms, type FormTemplateDto } from "../api/forms";

export function FormsListPage() {
  const [forms, setForms] = useState<FormTemplateDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listPublishedForms()
      .then(setForms)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Formularios</h1>

      {forms.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          No hay formularios disponibles por ahora.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {forms.map((form) => (
          <Link key={form.id} to={`/forms/${form.id}`}>
            <Card className="flex h-full items-start gap-3 hover:border-blue-300">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileText size={20} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-800">{form.title}</h2>
                {form.description && <p className="mt-0.5 text-sm text-slate-500">{form.description}</p>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
