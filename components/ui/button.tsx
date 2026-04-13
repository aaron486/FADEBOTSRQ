import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60",
  {
    variants: {
      variant: {
        default:
          "bg-neon text-charcoal hover:bg-neon-glow hover:shadow-neon active:scale-[0.98]",
        ghost:
          "bg-transparent text-white/70 hover:bg-charcoal-200 hover:text-white",
        outline:
          "border border-charcoal-300 bg-transparent text-white hover:border-neon/60 hover:text-neon",
        danger:
          "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-3 text-[10px]",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
