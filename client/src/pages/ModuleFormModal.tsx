import { useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useToast } from "../components/ToastProvider";
import { createModule, updateModule, type ModuleDto } from "../api/modules";

interface ModuleFormModalProps {
  editingModule?: ModuleDto;
  onClose: () => void;
  onSaved: () => void;
}

export function ModuleFormModal({ editingModule, onClose, onSaved }: ModuleFormModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(editingModule);

  const [name, setName] = useState(editingModule?.name ?? "");
  const [code, setCode] = useState(editingModule?.code ?? "");
  const [description, setDescription] = useState(editingModule?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditing && editingModule) {
        await updateModule(editingModule.id, { name, description: description || undefined });
      } else {
        await createModule({ name, code, description: description || undefined });
      }
      showToast(isEditing ? "Módulo actualizado" : "Módulo creado (con sus 4 permisos Leer/Crear/Editar/Eliminar)", "success");
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el módulo.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar módulo" : "Nuevo módulo"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />

        {isEditing ? (
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-600">Código</span>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{code}</p>
            <p className="text-xs text-slate-400">El código no se puede cambiar una vez creado el módulo.</p>
          </div>
        ) : (
          <Input
            label='Código (identificador único, ej. "Tasks")'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        )}

        <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />

        {!isEditing && (
          <p className="text-xs text-slate-500">
            Al crear el módulo se generan automáticamente sus 4 permisos: Leer, Crear, Editar y Eliminar.
          </p>
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
