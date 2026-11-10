"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Optional icon shown inside the field on the left */
  icon?: React.ReactNode;
  /** Optional element (e.g. a button) shown inside the field on the right */
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, trailing, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? `in-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="group relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 transition-colors group-focus-within:text-brand-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full rounded-xl border bg-white/85 px-4 py-2.5 text-slate-900 shadow-sm transition-all",
              "placeholder:text-slate-400",
              "focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15",
              "disabled:cursor-not-allowed disabled:opacity-60",
              icon && "pl-10",
              trailing && "pr-11",
              error ? "border-rose-400 focus:border-rose-400 focus:ring-rose-500/15" : "border-slate-200",
              className
            )}
            {...props}
          />
          {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
        </div>
        {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
