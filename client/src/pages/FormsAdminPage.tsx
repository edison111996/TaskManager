import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { listForms, deleteForm, setFormPublished, type FormTemplateDto } from "../api/forms";

export function FormsAdminPage() {
  const { showToast } = useToast();
  const [forms, setForms] = useState<FormTemplateDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function loadForms() {
    listForms()
      .then(setForms)
      .catch(() => setError("No se pudo cargar la lista de formularios."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadForms, []);

  async function handleTogglePublish(form: FormTemplateDto) {
    setBusyId(form.id);
    try {
      await setFormPublished(form.id, !form.isPublished);
      showToast(form.isPublished ? "Formulario despublicado" : "Formulario publicado", "success");
      loadForms();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo cambiar el estado.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(form: FormTemplateDto) {
    if (!confirm(`¿Eliminar el formulario "${form.title}"?`)) return;
    setBusyId(form.id);
    try {
      await deleteForm(form.id);
      showToast("Formulario eliminado", "success");
      loadForms();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar el formulario.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Constructor de formularios</h1>
        <Link to="/forms/admin/new">
          <Button icon={Plus}>Nuevo formulario</Button>
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Table
        rows={forms}
        getRowKey={(f) => f.id}
        emptyMessage="Todavía no hay formularios. Creá el primero con el botón de arriba."
        columns={[
          { header: "Título", render: (f) => <span className="font-medium text-slate-800">{f.title}</span> },
          {
            header: "Estado",
            render: (f) => (
              <Badge tone={f.isPublished ? "green" : "slate"}>{f.isPublished ? "Publicado" : "Borrador"}</Badge>
            ),
          },
          { header: "Respuestas", render: (f) => f.submissionCount },
          {
            header: "",
            render: (f) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" isLoading={busyId === f.id} onClick={() => handleTogglePublish(f)}>
                  {f.isPublished ? "Despublicar" : "Publicar"}
                </Button>
                <Link to={`/forms/admin/${f.id}`}>
                  <Button variant="secondary" icon={Pencil}>
                    Editar
                  </Button>
                </Link>
                <Link to={`/forms/admin/${f.id}/submissions`}>
                  <Button variant="secondary" icon={Eye}>
                    Respuestas
                  </Button>
                </Link>
                <Button variant="danger" icon={Trash2} isLoading={busyId === f.id} onClick={() => handleDelete(f)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
