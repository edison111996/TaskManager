import { useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { createProject, updateProject, type ProjectDto } from "../api/projects";
import { useToast } from "../components/ToastProvider";

interface ProjectFormModalProps {
  editingProject?: ProjectDto;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectFormModal({ editingProject, onClose, onSaved }: ProjectFormModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(editingProject);

  const [name, setName] = useState(editingProject?.name ?? "");
  const [description, setDescription] = useState(editingProject?.description ?? "");
  const [isActive, setIsActive] = useState(editingProject?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditing && editingProject) {
        await updateProject(editingProject.id, { name, description: description || undefined, isActive });
      } else {
        await createProject({ name, description: description || undefined });
      }
      showToast(isEditing ? "Proyecto actualizado" : "Proyecto creado", "success");
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el proyecto.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar proyecto" : "Nuevo proyecto"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        {isEditing && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Proyecto activo
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
