"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center gap-0 font-semibold rounded-xl select-none " +
    "transition-all duration-200 ease-out active:scale-[0.97] " +
    "focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary:
      "text-white bg-brand-gradient shadow-[0_8px_20px_-6px_rgb(79_70_229/0.55)] " +
      "hover:shadow-[0_12px_28px_-6px_rgb(79_70_229/0.6)] hover:-translate-y-0.5 focus-visible:ring-brand-300/60",
    secondary:
      "bg-white/90 text-slate-800 border border-slate-200 shadow-sm hover:bg-white hover:border-brand-200 " +
      "hover:text-brand-700 hover:-translate-y-0.5 focus-visible:ring-brand-200",
    danger:
      "text-white bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_8px_20px_-8px_rgb(225_29_72/0.6)] " +
      "hover:-translate-y-0.5 focus-visible:ring-rose-300",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:ring-slate-200",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-sm",
    md: "px-5 py-2.5 text-[15px]",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
