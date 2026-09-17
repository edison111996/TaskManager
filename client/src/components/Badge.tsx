import type { HTMLAttributes } from "react";

type Tone = "blue" | "slate" | "green" | "red";

const TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "slate", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}
