interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

// Un spinner es solo un círculo con un borde transparente de un lado, girando sin
// parar (animate-spin ya viene incluido en Tailwind, no hay que escribir el @keyframes).
export function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  const sizeClasses = size === "sm" ? "h-4 w-4 border-2" : "h-8 w-8 border-4";

  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClasses} ${className}`}
    />
  );
}
