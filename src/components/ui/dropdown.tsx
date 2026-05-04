"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useCallback,
  useMemo,
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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = rootRef.current?.querySelector("button[aria-haspopup='menu']");
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const top = rect.bottom + 8;
    setMenuStyle(
      align === "right"
        ? { position: "fixed", top, right: window.innerWidth - rect.right }
        : { position: "fixed", top, left: rect.left }
    );
  }, [align]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const rafId = requestAnimationFrame(() => updateMenuPosition());

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updateMenuPosition]);

  const contextValue = useMemo(() => ({ close: () => setOpen(false) }), [setOpen]);

  return (
    <DropdownContext.Provider value={contextValue}>
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
            style={menuStyle}
            className={cn(
              "z-50 max-h-[min(320px,calc(100vh-5rem))] min-w-[180px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)]"
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
