import type { HTMLAttributes } from "react";

// Un componente puede ser tan simple como "esta caja blanca con sombra que repito
// en todos lados" — no todo componente reutilizable necesita lógica.
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm ${className}`} {...props} />;
}
