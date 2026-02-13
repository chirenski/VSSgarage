"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;

  size?: "icon" | "text";
  title?: string;
  tooltip?: string;
  "aria-label"?: string;

  disabled?: boolean;
  className?: string;

  // optional “spin” behavior (used in your Customers page)
  hoverSpin?: boolean;
  spin?: boolean;
};

export function IconAction({
  href,
  onClick,
  children,
  size = "icon",
  title,
  tooltip,
  disabled,
  className,
  hoverSpin,
  spin,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg border transition-all select-none";

  const sizeCls =
    size === "icon"
      ? "h-9 w-9 text-base leading-none"
      : "h-9 px-3 text-sm gap-2";

  // Default look (match your orange theme)
  const theme =
    "border-orange-400/25 bg-white/5 hover:bg-white/10 hover:border-orange-400/45";

  const disabledCls = disabled ? "opacity-50 pointer-events-none" : "";

  // Spin on hover / spinning state
  const spinCls = cn(
    (hoverSpin || spin) && "motion-safe:[&>span]:transition-transform",
    hoverSpin && "motion-safe:hover:[&>span]:rotate-180",
    spin && "motion-safe:[&>span]:animate-spin"
  );

  const content = (
    <span className={cn("inline-flex", spinCls)}>{children}</span>
  );

  const commonProps = {
    title: tooltip ?? title,
    className: cn(base, sizeCls, theme, disabledCls, className),
    ...rest,
  } as const;

  if (href) {
    // Link variant
    return (
      <Link href={href} {...commonProps}>
        {content}
      </Link>
    );
  }

  // Button variant
  return (
    <button type="button" onClick={onClick} disabled={disabled} {...commonProps}>
      {content}
    </button>
  );
}
