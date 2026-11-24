import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  /** Si se pasa, aparece el botón "Reintentar". */
  onRetry?: () => void;
}

// Contraparte de LoadingState: lo que se muestra cuando la carga de una página falló.
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-8 text-center">
      <AlertCircle size={28} className="text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" icon={RotateCw} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
