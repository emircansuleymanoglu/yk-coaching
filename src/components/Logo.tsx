import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-sm font-black tracking-tighter text-white shadow-lg shadow-[var(--primary-strong)]/30">
        YK
      </span>
      {withText && (
        <span className="text-lg font-extrabold tracking-tight">
          Coaching
        </span>
      )}
    </span>
  );
}
