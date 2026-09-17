import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

// Componente "controlado": recibe value/onChange como props (los maneja quien lo usa),
// el componente solo se encarga de verse siempre igual (label + estilos + error).
export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
          error ? "border-red-400" : "border-slate-300 focus:border-blue-500"
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
