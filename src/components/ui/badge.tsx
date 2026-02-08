import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--color-surface-muted)] text-[color:var(--color-foreground)]",
        success: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
        warning: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
        danger: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
        info: "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);

Badge.displayName = "Badge";
