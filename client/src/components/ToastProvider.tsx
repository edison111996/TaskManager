import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TYPE_CLASSES: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-slate-800",
};

const TYPE_ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

// Un error se lee más despacio que un "guardado": le damos más tiempo en pantalla.
const DURATION_MS: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  error: 7000,
};

let nextId = 1;

// Este Provider guarda la lista de toasts activos en estado y los va quitando solo
// con setTimeout — cualquier componente hijo puede pedir uno con useToast().showToast(...)
// sin tener que pasarse funciones por props (para eso sirve un Context).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => dismissToast(id), DURATION_MS[type]);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* aria-live: los lectores de pantalla anuncian los toasts nuevos sin que el usuario mueva el foco. */}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = TYPE_ICONS[toast.type];
          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${TYPE_CLASSES[toast.type]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1 break-words">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Cerrar notificación"
                className="shrink-0 rounded p-0.5 text-white/80 hover:bg-white/20 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}
