import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  /** "danger" (rojo) para acciones destructivas como eliminar. */
  variant?: "primary" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

// Mismo patrón que ToastProvider: el diálogo vive UNA vez aquí arriba y cualquier página
// lo pide con useConfirm(). Devuelve una Promise<boolean>, así que el código que lo usa
// casi no cambia respecto al confirm() del navegador:
//     if (!(await confirm({ message: "..." }))) return;
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Guardamos la función "resolve" de la Promise para completarla cuando el usuario decida.
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal title={options.title ?? "Confirmar acción"} onClose={() => close(false)}>
          <p className="text-sm text-slate-600">{options.message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button
              variant={options.variant === "primary" ? "primary" : "danger"}
              onClick={() => close(true)}
              autoFocus
            >
              {options.confirmLabel ?? "Eliminar"}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}
