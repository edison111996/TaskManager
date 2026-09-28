import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Upload } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/ToastProvider";
import { getFormForFill, submitForm, uploadFormFile, type FormFieldDto, type FormTemplateDetailDto } from "../api/forms";

interface AnswerValue {
  text: string;
  options: string[];
  filePath: string | null;
  fileName: string | null;
}

function emptyAnswer(): AnswerValue {
  return { text: "", options: [], filePath: null, fileName: null };
}

export function FormFillPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormTemplateDetailDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getFormForFill(id)
      .then((result) => {
        setForm(result);
        const initial: Record<string, AnswerValue> = {};
        result.fields.forEach((field) => {
          initial[field.id] = emptyAnswer();
        });
        setAnswers(initial);
      })
      .catch(() => setError("Este formulario no existe o no está disponible."))
      .finally(() => setIsLoading(false));
  }, [id]);

  function updateAnswer(fieldId: string, patch: Partial<AnswerValue>) {
    setAnswers((current) => ({ ...current, [fieldId]: { ...current[fieldId], ...patch } }));
  }

  function toggleMultiOption(fieldId: string, option: string) {
    setAnswers((current) => {
      const existing = current[fieldId]?.options ?? [];
      const next = existing.includes(option) ? existing.filter((o) => o !== option) : [...existing, option];
      return { ...current, [fieldId]: { ...current[fieldId], options: next } };
    });
  }

  async function handleFileChange(field: FormFieldDto, file: File | null) {
    if (!file) return;
    setUploadingFieldId(field.id);
    try {
      const path = await uploadFormFile(file);
      updateAnswer(field.id, { filePath: path, fileName: file.name });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo subir el archivo.", "error");
    } finally {
      setUploadingFieldId(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id || !form) return;

    setIsSubmitting(true);
    try {
      const payload = form.fields.map((field) => {
        const answer = answers[field.id] ?? emptyAnswer();
        return {
          formFieldId: field.id,
          valueText: answer.text || undefined,
          valueOptions: answer.options.length > 0 ? answer.options : undefined,
          filePath: answer.filePath ?? undefined,
        };
      });

      await submitForm(id, payload);
      showToast("Respuesta enviada, ¡gracias!", "success");
      navigate("/forms");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo enviar el formulario.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <LoadingState />;
  if (error || !form) return <p className="text-red-600">{error ?? "Formulario no encontrado."}</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/forms" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
        <ArrowLeft size={15} />
        Volver a formularios
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{form.title}</h1>
        {form.description && <p className="mt-1 text-slate-500">{form.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {form.fields
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <Card key={field.id}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  {field.label}
                  {field.isRequired && <span className="ml-1 text-red-500">*</span>}
                </span>
                <FieldInput
                  field={field}
                  value={answers[field.id] ?? emptyAnswer()}
                  onChangeText={(text) => updateAnswer(field.id, { text })}
                  onToggleOption={(option) => toggleMultiOption(field.id, option)}
                  onFileChange={(file) => handleFileChange(field, file)}
                  isUploading={uploadingFieldId === field.id}
                />
              </label>
            </Card>
          ))}

        <div className="flex justify-end">
          <Button type="submit" icon={Send} isLoading={isSubmitting}>
            Enviar respuesta
          </Button>
        </div>
      </form>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChangeText,
  onToggleOption,
  onFileChange,
  isUploading,
}: {
  field: FormFieldDto;
  value: AnswerValue;
  onChangeText: (text: string) => void;
  onToggleOption: (option: string) => void;
  onFileChange: (file: File | null) => void;
  isUploading: boolean;
}) {
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  switch (field.type) {
    case "ShortText":
      return <input value={value.text} onChange={(e) => onChangeText(e.target.value)} className={inputClass} />;
    case "Paragraph":
      return (
        <textarea value={value.text} onChange={(e) => onChangeText(e.target.value)} rows={3} className={inputClass} />
      );
    case "Number":
      return (
        <input type="number" value={value.text} onChange={(e) => onChangeText(e.target.value)} className={inputClass} />
      );
    case "Date":
      return (
        <input type="date" value={value.text} onChange={(e) => onChangeText(e.target.value)} className={inputClass} />
      );
    case "Dropdown":
      return (
        <select value={value.text} onChange={(e) => onChangeText(e.target.value)} className={inputClass}>
          <option value="">— Elegí una opción —</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "SingleChoice":
      return (
        <div className="space-y-1.5">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" name={field.id} checked={value.text === option} onChange={() => onChangeText(option)} />
              {option}
            </label>
          ))}
        </div>
      );
    case "MultipleChoice":
      return (
        <div className="space-y-1.5">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value.options.includes(option)}
                onChange={() => onToggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    case "FileUpload":
      return (
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <Upload size={15} />
            {isUploading ? "Subiendo..." : "Elegir archivo"}
            <input
              type="file"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {value.fileName && <span className="text-sm text-slate-500">{value.fileName}</span>}
        </div>
      );
    default:
      return null;
  }
}
