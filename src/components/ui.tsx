import * as React from "react";
import { cn } from "@/lib/utils";

/* ----------------------------- Button ----------------------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";
  const variants = {
    primary:
      "text-white shadow-lg shadow-[var(--primary-strong)]/20 brand-gradient hover:brightness-110",
    outline:
      "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-2)]",
    ghost: "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]",
    danger: "bg-[var(--danger)] text-white hover:brightness-110",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-13 px-6 text-base",
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

/* ----------------------------- Card ----------------------------- */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
        className,
      )}
      {...props}
    />
  );
}

/* ----------------------------- Input ----------------------------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30",
        className,
      )}
      {...props}
    />
  );
});

/* ----------------------------- Label ----------------------------- */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-[var(--muted)]", className)}
      {...props}
    />
  );
}

/* ----------------------------- Badge ----------------------------- */
export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger" | "primary";
}) {
  const tones = {
    default: "bg-[var(--surface-2)] text-[var(--muted)]",
    success: "bg-[var(--success)]/15 text-[var(--success)]",
    warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
    danger: "bg-[var(--danger)]/15 text-[var(--danger)]",
    primary: "bg-[var(--primary)]/15 text-[var(--primary-glow)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
