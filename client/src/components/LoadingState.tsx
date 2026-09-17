import { Spinner } from "./Spinner";

export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
      <Spinner size="md" className="text-blue-600" />
      <span>{label}</span>
    </div>
  );
}
