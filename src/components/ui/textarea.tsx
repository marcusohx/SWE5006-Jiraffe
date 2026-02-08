import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-sm text-[color:var(--color-foreground)] shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)] placeholder:text-[color:var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
