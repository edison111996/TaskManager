import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { listProjects, deleteProject, type ProjectDto } from "../api/projects";
import { ProjectFormModal } from "./ProjectFormModal";

export function ProjectsPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  // La administración de proyectos reutiliza los permisos de Tasks — ver ProjectsController.
  const canCreate = hasPermission("Tasks:Create");
  const canEdit = hasPermission("Tasks:Edit");
  const canDelete = hasPermission("Tasks:Delete");
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadProjects() {
    listProjects()
      .then(setProjects)
      .catch(() => setError("No se pudo cargar la lista de proyectos."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadProjects, []);

  async function handleDelete(project: ProjectDto) {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"? Las tareas que tenga quedarán sin proyecto.`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      showToast("Proyecto eliminado", "success");
      loadProjects();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar el proyecto.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Proyectos</h1>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsCreating(true)}>
            Nuevo proyecto
          </Button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Table
        rows={projects}
        getRowKey={(p) => p.id}
        emptyMessage="Todavía no hay proyectos. Creá el primero con el botón de arriba."
        columns={[
          { header: "Nombre", render: (p) => p.name },
          { header: "Descripción", render: (p) => p.description ?? "—" },
          {
            header: "Estado",
            render: (p) => <Badge tone={p.isActive ? "green" : "red"}>{p.isActive ? "Activo" : "Inactivo"}</Badge>,
          },
          ...(canEdit || canDelete
            ? [
                {
                  header: "",
                  render: (p: ProjectDto) => (
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button variant="secondary" icon={Pencil} onClick={() => setEditingProject(p)}>
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          icon={Trash2}
                          isLoading={deletingId === p.id}
                          onClick={() => handleDelete(p)}
                        >
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

      {isCreating && <ProjectFormModal onClose={() => setIsCreating(false)} onSaved={loadProjects} />}

      {editingProject && canEdit && (
        <ProjectFormModal editingProject={editingProject} onClose={() => setEditingProject(null)} onSaved={loadProjects} />
      )}
    </div>
  );
}
