import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React solo permite atrapar errores de renderizado con una CLASE (no existe hook equivalente).
// Si un hijo lanza un error al renderizar, en vez de dejar toda la app en blanco mostramos
// una pantalla de respaldo.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error de renderizado:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle size={40} className="text-amber-500" />
        <h2 className="text-xl font-semibold text-slate-800">Algo salió mal</h2>
        <p className="max-w-md text-sm text-slate-500">
          Ocurrió un error inesperado en esta pantalla. Puedes volver al inicio o recargar la página.
        </p>
        <div className="flex gap-2">
          <a href="/" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Ir al inicio
          </a>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
