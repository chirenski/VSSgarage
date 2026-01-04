import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "w-full rounded-lg",
        "border border-white/10 bg-black/25",
        "px-3 py-2 text-sm text-white",
        "placeholder:text-gray-400",
        "outline-none transition",
        "focus:border-orange-400/40 focus:ring-4 focus:ring-orange-500/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
