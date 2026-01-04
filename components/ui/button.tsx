import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "danger";
  asChild?: boolean;
};

export function Button({
  className = "",
  variant = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium " +
    "transition-all duration-200 ease-out " +
    "hover:-translate-y-[1px] hover:shadow-lg " +
    "active:translate-y-0 active:shadow-none active:scale-[0.99] " +
    "focus:outline-none focus:ring-4 focus:ring-orange-500/15 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<string, string> = {
    default:
      "accent-ring bg-orange-500/12 text-orange-200 border border-orange-400/20 " +
      "hover:bg-orange-500/18 hover:text-orange-100 hover:shadow-orange-500/20",
    outline:
      "border border-white/12 bg-white/5 text-gray-100 " +
      "hover:bg-white/10 hover:border-orange-400/20 hover:shadow-orange-500/10",
    ghost:
      "text-gray-100 hover:bg-white/7 hover:text-white hover:shadow-white/5",
    danger:
      "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/15 hover:shadow-red-500/15",
  };

  const Comp: any = asChild ? Slot : "button";
  const { children, ...rest } = props;

  return (
    <Comp className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Comp>
  );
}
