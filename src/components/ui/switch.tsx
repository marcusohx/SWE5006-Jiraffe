import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, ...props }, ref) => (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      className={cn(
        "h-6 w-11 rounded-full border border-transparent transition",
        checked ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-border)]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition",
          checked && "translate-x-5"
        )}
      />
    </button>
  )
);

Switch.displayName = "Switch";
