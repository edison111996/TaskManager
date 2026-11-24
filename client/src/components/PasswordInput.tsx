import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  icon?: LucideIcon;
}

// Igual que Input, pero con un botón de ojo para ver/ocultar lo escrito.
// tabIndex={-1} en el botón: al tabular entre campos no se detiene en el ojo.
export function PasswordInput({ label, error, icon: Icon, className = "", ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
        <input
          type={isVisible ? "text" : "password"}
          className={`w-full rounded-lg border py-2 pr-10 text-sm ${Icon ? "pl-9" : "pl-3"} focus:outline-none ${
            error ? "border-red-400" : "border-slate-300 focus:border-blue-500"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
