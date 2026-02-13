"use client";

import Link from "next/link";
import * as React from "react";

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

// Малък helper вместо "@/lib/utils"
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

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

  // Default look (orange-ish)
  const theme =
    "border-orange-400/25 bg-white/5 hover:bg-white/10 hover:border-orange-400/45";

  const disabledCls = disabled ? "opacity-50 pointer-events-none" : "";

  // Spin behavior
  const spinWrapCls = cn(
    (hoverSpin || spin) && "motion-safe:[&>span]:transition-transform",
    hoverSpin && "motion-safe:hover:[&>span]:rotate-180",
    spin && "motion-safe:[&>span]:animate-spin"
  );

  const content = <span className={spinWrapCls}>{children}</span>;

  const common = {
    title: tooltip ?? title,
    className: cn(base, sizeCls, theme, disabledCls, className),
