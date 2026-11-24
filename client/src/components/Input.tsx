import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Ícono decorativo a la izquierda dentro del campo. */
  icon?: LucideIcon;
}

// Componente "controlado": recibe value/onChange como props (los maneja quien lo usa),
// el componente solo se encarga de verse siempre igual (label + estilos + error).
export function Input({ label, error, icon: Icon, className = "", ...props }: InputProps) {
  const field = (
    <input
      className={`w-full rounded-lg border py-2 text-sm focus:outline-none ${Icon ? "pl-9 pr-3" : "px-3"} ${
        error ? "border-red-400" : "border-slate-300 focus:border-blue-500"
      } ${className}`}
      {...props}
    />
  );

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {Icon ? (
        <div className="relative">
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {field}
        </div>
      ) : (
        field
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
