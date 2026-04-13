import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "neon" | "muted" | "warn";
  className?: string;
}) {
  const styles = {
    default: "bg-charcoal-200 text-white/70 border-charcoal-300",
    neon: "bg-neon/10 text-neon border-neon/40",
    muted: "bg-charcoal-100 text-white/40 border-charcoal-300/50",
    warn: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
        styles,
        className
      )}
    >
      {children}
    </span>
  );
}
