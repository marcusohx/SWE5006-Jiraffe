"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type DropdownContextValue = {
  close: () => void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function Dropdown({
  trigger,
  children,
  align = "left",
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <div className="relative inline-block" ref={rootRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="block text-left"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {trigger}
        </button>
        {open ? (
          <div
            role="menu"
            className={cn(
              "absolute z-20 mt-2 min-w-[180px] rounded-xl border border-border bg-white p-1 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownItem({
  children,
  onClick,
  selected,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const context = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) {
      return;
    }
    onClick?.();
    context?.close();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
        selected
          ? "bg-accent-soft text-accent"
          : "text-foreground hover:bg-surface-muted",
        disabled ? "cursor-not-allowed opacity-50" : ""
      )}
    >
      {children}
    </button>
  );
}
