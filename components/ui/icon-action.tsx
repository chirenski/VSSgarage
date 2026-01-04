"use client";

import Link from "next/link";
import * as React from "react";

type IconActionProps = {
  href?: string;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
  size?: "icon" | "text";
  className?: string;
  children: React.ReactNode;

  /** ако е true: върти съдържанието постоянно (за loading) */
  spin?: boolean;

  /** ако е true: върти леко на hover (подходящо за refresh) */
  hoverSpin?: boolean;

  /** tooltip text (ако не подадеш, ще ползва title) */
  tooltip?: string;

  disabled?: boolean;
};

export function IconAction({
  href,
  onClick,
  title,
  size = "icon",
  className = "",
  children,
  spin = false,
  hoverSpin = false,
  tooltip,
  disabled = false,
  ...rest
}: IconActionProps) {
  const base =
    "group relative inline-flex items-center justify-center rounded-lg border border-orange-400/25 bg-white/5 text-white/80 " +
    "transition-all duration-200 ease-out " +
    "hover:border-orange-400/45 hover:bg-orange-500/10 hover:text-white hover:shadow-orange-500/15 " +
    "focus:outline-none focus:ring-4 focus:ring-orange-500/15 " +
    "active:scale-[0.98]";

  const sizing = size === "icon" ? "h-9 w-9" : "h-9 px-3";

  const disabledCls = disabled ? "opacity-60 pointer-events-none" : "";

  const Comp: any = href ? Link : "button";

  const tip = tooltip ?? title;

  const innerCls = [
    "inline-flex items-center gap-2 transition-transform duration-200",
    "group-hover:rotate-[-4deg] group-hover:scale-[1.06]",
    hoverSpin ? "group-hover:rotate-[180deg]" : "",
    spin ? "animate-spin" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Comp
      href={href as any}
      onClick={onClick}
      title={title}
      className={`${base} ${sizing} ${disabledCls} ${className}`}
      aria-disabled={disabled ? true : undefined}
      {...rest}
    >
      <span className={innerCls}>{children}</span>

      {tip && (
        <span
          className={[
            "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2",
            "rounded-md border border-white/10 bg-[#0b0f14]/95 px-2 py-1 text-xs text-white/80",
            "opacity-0 translate-y-1 transition duration-150",
            "group-hover:opacity-100 group-hover:translate-y-0",
            "shadow-xl backdrop-blur",
            "whitespace-nowrap",
          ].join(" ")}
        >
          {tip}
        </span>
      )}
    </Comp>
  );
}
