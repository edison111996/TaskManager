import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

// "variant" es un patrón muy común: en vez de mandar clases de CSS sueltas desde
// cada pantalla, el componente decide cómo se ve cada variante y quien lo usa
// solo elige "cuál" quiere.
type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Muestra un spinner y deshabilita el botón — para no dejar hacer doble clic mientras se guarda. */
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
};

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Spinner className="text-current" />}
      {children}
    </button>
  );
}
