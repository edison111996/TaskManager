import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card } from "../components/Card";
import { LoadingState } from "../components/LoadingState";
import { getFormSubmissions, type FormSubmissionDto } from "../api/forms";

export function FormSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<FormSubmissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getFormSubmissions(id)
      .then(setSubmissions)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/forms/admin" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
        <ArrowLeft size={15} />
        Volver a formularios
      </Link>

      <h1 className="text-2xl font-bold text-slate-800">Respuestas ({submissions.length})</h1>

      {submissions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Todavía no hay respuestas.
        </p>
      )}

      <div className="space-y-3">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <p className="mb-2 text-xs text-slate-400">
              {submission.submittedByName} · {new Date(submission.createdAt).toLocaleString()}
            </p>
            <dl className="space-y-2">
              {submission.answers.map((answer) => (
                <div key={answer.formFieldId}>
                  <dt className="text-sm font-medium text-slate-600">{answer.fieldLabel}</dt>
                  <dd className="text-sm text-slate-800">
                    {answer.filePath ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL}${answer.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Ver archivo
                      </a>
                    ) : answer.valueOptions && answer.valueOptions.length > 0 ? (
                      answer.valueOptions.join(", ")
                    ) : (
                      answer.valueText || "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
