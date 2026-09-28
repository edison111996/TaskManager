import { AlignLeft, Calendar, CheckSquare, CircleDot, Hash, List, Type, Upload, type LucideIcon } from "lucide-react";
import type { FormFieldType } from "../api/forms";

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  ShortText: "Texto corto",
  Paragraph: "Párrafo",
  SingleChoice: "Opción única",
  MultipleChoice: "Opción múltiple",
  Dropdown: "Desplegable",
  Date: "Fecha",
  Number: "Número",
  FileUpload: "Archivo / imagen",
};

export const FIELD_TYPE_ICONS: Record<FormFieldType, LucideIcon> = {
  ShortText: Type,
  Paragraph: AlignLeft,
  SingleChoice: CircleDot,
  MultipleChoice: CheckSquare,
  Dropdown: List,
  Date: Calendar,
  Number: Hash,
  FileUpload: Upload,
};

export const ALL_FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FormFieldType[];

const TYPES_WITH_OPTIONS: ReadonlySet<FormFieldType> = new Set(["SingleChoice", "MultipleChoice", "Dropdown"]);

export function fieldTypeHasOptions(type: FormFieldType): boolean {
  return TYPES_WITH_OPTIONS.has(type);
}
