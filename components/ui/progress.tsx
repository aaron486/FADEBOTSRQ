import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
}: {
  value?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-charcoal-300/80",
        className
      )}
    >
      <div
        style={{ width: `${pct}%` }}
        className="h-full rounded-full bg-gradient-to-r from-neon-dim via-neon to-neon-glow shadow-neon transition-[width] duration-500"
      />
    </div>
  );
}
