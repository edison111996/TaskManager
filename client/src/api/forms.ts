import { apiFetch } from "./httpClient";

export type FormFieldType =
  | "ShortText"
  | "Paragraph"
  | "SingleChoice"
  | "MultipleChoice"
  | "Dropdown"
  | "Date"
  | "Number"
  | "FileUpload";

export interface FormFieldDto {
  id: string;
  label: string;
  type: FormFieldType;
  isRequired: boolean;
  order: number;
  options: string[] | null;
}

export interface FormTemplateDto {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  submissionCount: number;
  createdAt: string;
}

export interface FormTemplateDetailDto {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  submissionCount: number;
  fields: FormFieldDto[];
  createdAt: string;
}

export interface FormFieldInput {
  label: string;
  type: FormFieldType;
  isRequired: boolean;
  order: number;
  options?: string[] | null;
}

export interface SaveFormTemplateInput {
  title: string;
  description?: string;
  fields: FormFieldInput[];
}

export interface FormAnswerInput {
  formFieldId: string;
  valueText?: string | null;
  valueOptions?: string[] | null;
  filePath?: string | null;
}

export interface FormAnswerDto {
  formFieldId: string;
  fieldLabel: string;
  valueText: string | null;
  valueOptions: string[] | null;
  filePath: string | null;
}

export interface FormSubmissionDto {
  id: string;
  submittedByName: string;
  createdAt: string;
  answers: FormAnswerDto[];
}

// ---- Constructor (admin) ----

export function listForms() {
  return apiFetch<FormTemplateDto[]>("/api/forms");
}

export function getForm(id: string) {
  return apiFetch<FormTemplateDetailDto>(`/api/forms/${id}`);
}

export function createForm(input: SaveFormTemplateInput) {
  return apiFetch<FormTemplateDto>("/api/forms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateForm(id: string, input: SaveFormTemplateInput) {
  return apiFetch<FormTemplateDto>(`/api/forms/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function setFormPublished(id: string, isPublished: boolean) {
  return apiFetch<FormTemplateDto>(`/api/forms/${id}/publish`, {
    method: "PATCH",
    body: JSON.stringify(isPublished),
  });
}

export function deleteForm(id: string) {
  return apiFetch<void>(`/api/forms/${id}`, { method: "DELETE" });
}

export function getFormSubmissions(id: string) {
  return apiFetch<FormSubmissionDto[]>(`/api/forms/${id}/submissions`);
}

// ---- Diligenciar (cualquier usuario) ----

export function listPublishedForms() {
  return apiFetch<FormTemplateDto[]>("/api/forms/published");
}

export function getFormForFill(id: string) {
  return apiFetch<FormTemplateDetailDto>(`/api/forms/${id}/fill`);
}

export function submitForm(id: string, answers: FormAnswerInput[]) {
  return apiFetch<void>(`/api/forms/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function uploadFormFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch<{ path: string }>("/api/forms/uploads", {
    method: "POST",
    body: formData,
  });
  return result.path;
}
