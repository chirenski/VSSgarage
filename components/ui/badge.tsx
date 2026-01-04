import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "muted";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const map: Record<string, string> = {
    default: "border-white/10 bg-white/5 text-gray-200",
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    warning: "border-orange-400/20 bg-orange-500/10 text-orange-200",
    danger: "border-red-400/20 bg-red-500/10 text-red-200",
    muted: "border-white/10 bg-white/3 text-gray-400",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        map[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
