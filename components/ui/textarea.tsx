import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-xl border border-charcoal-300/60 bg-charcoal-50/80 px-3 py-2 text-sm text-white placeholder:text-white/30",
      "focus:outline-none focus:border-neon/60 focus:ring-2 focus:ring-neon/20 transition",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
