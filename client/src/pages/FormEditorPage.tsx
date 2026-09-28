import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { createForm, updateForm, getForm, type FormFieldType } from "../api/forms";
import { ALL_FIELD_TYPES, FIELD_TYPE_ICONS, FIELD_TYPE_LABELS, fieldTypeHasOptions } from "../utils/formField";

interface FieldDraft {
  clientId: string;
  label: string;
  type: FormFieldType;
  isRequired: boolean;
  options: string[];
}

function newField(type: FormFieldType): FieldDraft {
  return { clientId: crypto.randomUUID(), label: "", type, isRequired: false, options: [] };
}

const PALETTE_PREFIX = "palette:";
const CANVAS_END_ID = "canvas-end";

type ActiveDrag = { kind: "palette"; type: FormFieldType } | { kind: "field"; field: FieldDraft };

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  // Mismo umbral de 8px que en el Kanban: sin esto, dnd-kit interpreta un click
  // normal (sin mover el mouse) como el inicio de un drag — y acá los chips de la
  // paleta necesitan servir para las dos cosas: click rápido O arrastrar.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!id) return;
    getForm(id)
      .then((form) => {
        setTitle(form.title);
        setDescription(form.description ?? "");
        setSubmissionCount(form.submissionCount);
        setFields(
          form.fields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((f) => ({
              clientId: f.id,
              label: f.label,
              type: f.type,
              isRequired: f.isRequired,
              options: f.options ?? [],
            })),
        );
      })
      .catch(() => showToast("No se pudo cargar el formulario.", "error"))
      .finally(() => setIsLoading(false));
  }, [id, showToast]);

  // Un formulario con respuestas no puede perder/reordenar preguntas — ver la
  // regla equivalente en el backend (FormService.UpdateAsync).
  const isLocked = isEditing && submissionCount > 0;

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    if (activeId.startsWith(PALETTE_PREFIX)) {
      setActiveDrag({ kind: "palette", type: activeId.slice(PALETTE_PREFIX.length) as FormFieldType });
      return;
    }
    const field = fields.find((f) => f.clientId === activeId);
    if (field) setActiveDrag({ kind: "field", field });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Arrastraron un tipo de la paleta: insertar un campo nuevo en esa posición
    // (antes del campo sobre el que soltaron, o al final si soltaron en la zona vacía).
    if (activeId.startsWith(PALETTE_PREFIX)) {
      const type = activeId.slice(PALETTE_PREFIX.length) as FormFieldType;
      setFields((current) => {
        const overIndex = current.findIndex((f) => f.clientId === overId);
        const insertAt = overIndex === -1 ? current.length : overIndex;
        const next = current.slice();
        next.splice(insertAt, 0, newField(type));
        return next;
      });
      return;
    }

    if (activeId === overId) return;

    // Reordenar un campo existente.
    setFields((current) => {
      const oldIndex = current.findIndex((f) => f.clientId === activeId);
      if (oldIndex === -1) return current;

      if (overId === CANVAS_END_ID) {
        const next = current.slice();
        const [moved] = next.splice(oldIndex, 1);
        next.push(moved);
        return next;
      }

      const newIndex = current.findIndex((f) => f.clientId === overId);
      return newIndex === -1 ? current : arrayMove(current, oldIndex, newIndex);
    });
  }

  function addFieldAtEnd(type: FormFieldType) {
    setFields((current) => [...current, newField(type)]);
  }

  function updateField(clientId: string, patch: Partial<FieldDraft>) {
    setFields((current) => current.map((f) => (f.clientId === clientId ? { ...f, ...patch } : f)));
  }

  function removeField(clientId: string) {
    setFields((current) => current.filter((f) => f.clientId !== clientId));
  }

  async function handleSave() {
    // El botón se deshabilita con isSaving, pero el re-render no es instantáneo —
    // esta guarda corta un doble-click que llegue antes de que el DOM se actualice.
    if (isSaving) return;

    if (!title.trim()) {
      showToast("Ponele un título al formulario.", "error");
      return;
    }
    if (fields.length === 0) {
      showToast("Agregá al menos una pregunta.", "error");
      return;
    }
    if (fields.some((f) => !f.label.trim())) {
      showToast("Todas las preguntas necesitan un texto.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        fields: fields.map((f, index) => ({
          label: f.label.trim(),
          type: f.type,
          isRequired: f.isRequired,
          order: index,
          options: fieldTypeHasOptions(f.type) ? f.options.map((o) => o.trim()).filter(Boolean) : null,
        })),
      };

      if (isEditing && id) {
        await updateForm(id, payload);
        showToast("Formulario actualizado", "success");
      } else {
        await createForm(payload);
        showToast("Formulario creado", "success");
      }
      navigate("/forms/admin");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo guardar el formulario.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">{isEditing ? "Editar formulario" : "Nuevo formulario"}</h1>

      {isLocked && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Este formulario ya tiene {submissionCount} respuesta{submissionCount === 1 ? "" : "s"} — las preguntas
          quedaron bloqueadas para no invalidar lo ya respondido. Solo podés cambiar el título y la descripción.
        </p>
      )}

      <Card className="space-y-3">
        <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-600">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
      </Card>

      {isLocked ? (
        <div className="space-y-2">
          <h2 className="font-semibold text-slate-700">Preguntas</h2>
          {fields.map((field) => (
            <Card key={field.clientId} className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">{field.label}</span> — {FIELD_TYPE_LABELS[field.type]}
              {field.isRequired && <span className="ml-1 text-red-500">*</span>}
            </Card>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <FieldPalette onQuickAdd={addFieldAtEnd} />

            <div className="space-y-2">
              <h2 className="font-semibold text-slate-700">Preguntas</h2>
              <FormCanvas fields={fields} onChange={updateField} onRemove={removeField} />
            </div>
          </div>

          <DragOverlay>
            {activeDrag?.kind === "palette" && <PaletteChipPreview type={activeDrag.type} />}
            {activeDrag?.kind === "field" && <FieldCardPreview field={activeDrag.field} />}
          </DragOverlay>
        </DndContext>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate("/forms/admin")}>
          Cancelar
        </Button>
        <Button icon={Save} isLoading={isSaving} onClick={handleSave}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

function FieldPalette({ onQuickAdd }: { onQuickAdd: (type: FormFieldType) => void }) {
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-slate-700">Tipos de campo</h2>
      <p className="text-xs text-slate-400">Arrastrá uno al formulario, o hacé click para agregarlo al final.</p>
      <div className="space-y-1.5">
        {ALL_FIELD_TYPES.map((type) => (
          <PaletteChip key={type} type={type} onClick={() => onQuickAdd(type)} />
        ))}
      </div>
    </div>
  );
}

function PaletteChip({ type, onClick }: { type: FormFieldType; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${PALETTE_PREFIX}${type}` });
  const Icon = FIELD_TYPE_ICONS[type];

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      type="button"
      className={`flex w-full cursor-grab touch-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <Icon size={16} className="shrink-0 text-slate-400" />
      {FIELD_TYPE_LABELS[type]}
    </button>
  );
}

function PaletteChipPreview({ type }: { type: FormFieldType }) {
  const Icon = FIELD_TYPE_ICONS[type];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg">
      <Icon size={16} className="text-blue-500" />
      {FIELD_TYPE_LABELS[type]}
    </div>
  );
}

function FieldCardPreview({ field }: { field: FieldDraft }) {
  return (
    <div className="rounded-xl border border-blue-300 bg-white p-4 shadow-lg">
      <span className="text-sm font-medium text-slate-800">{field.label || "Pregunta sin título"}</span>
      <span className="ml-2 text-xs text-slate-400">{FIELD_TYPE_LABELS[field.type]}</span>
    </div>
  );
}

function FormCanvas({
  fields,
  onChange,
  onRemove,
}: {
  fields: FieldDraft[];
  onChange: (clientId: string, patch: Partial<FieldDraft>) => void;
  onRemove: (clientId: string) => void;
}) {
  return (
    <SortableContext items={fields.map((f) => f.clientId)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {fields.map((field) => (
          <FieldEditor
            key={field.clientId}
            field={field}
            onChange={(patch) => onChange(field.clientId, patch)}
            onRemove={() => onRemove(field.clientId)}
          />
        ))}
        <EndDropZone isEmpty={fields.length === 0} />
      </div>
    </SortableContext>
  );
}

function EndDropZone({ isEmpty }: { isEmpty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_END_ID });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed text-center text-sm transition-colors ${
        isEmpty ? "py-10" : "py-3"
      } ${isOver ? "border-blue-400 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-400"}`}
    >
      {isEmpty ? "Arrastrá un tipo de campo acá para empezar" : "Soltá acá para agregar al final"}
    </div>
  );
}

function FieldEditor({
  field,
  onChange,
  onRemove,
}: {
  field: FieldDraft;
  onChange: (patch: Partial<FieldDraft>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.clientId });

  const style = { transform: CSS.Transform.toString(transform), transition };

  function addOption() {
    onChange({ options: [...field.options, ""] });
  }

  function updateOption(index: number, value: string) {
    const next = field.options.slice();
    next[index] = value;
    onChange({ options: next });
  }

  function removeOption(index: number) {
    onChange({ options: field.options.filter((_, i) => i !== index) });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-2 shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="Escribí la pregunta..."
              className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <select
              value={field.type}
              onChange={(e) => onChange({ type: e.target.value as FormFieldType, options: [] })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={field.isRequired}
                onChange={(e) => onChange({ isRequired: e.target.checked })}
              />
              Obligatoria
            </label>
            <button
              onClick={onRemove}
              aria-label="Eliminar pregunta"
              className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {fieldTypeHasOptions(field.type) && (
            <div className="space-y-1.5 pl-1">
              {field.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button onClick={() => removeOption(index)} className="text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={addOption} className="text-xs font-medium text-blue-600 hover:underline">
                + Agregar opción
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
