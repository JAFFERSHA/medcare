"use client";

import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast, ToastType } from "@/contexts/ToastContext";

const config: Record<ToastType, { icon: React.ReactNode; classes: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-emerald-50/95 border-emerald-200 text-emerald-800",
  },
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-rose-50/95 border-rose-200 text-rose-800",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    classes: "bg-amber-50/95 border-amber-200 text-amber-800",
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    classes: "bg-brand-50/95 border-brand-200 text-brand-700",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon, classes } = config[toast.type];
  return (
    <div
      className={`flex animate-pop items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_-16px_rgb(15_23_42/0.35)] backdrop-blur-xl min-w-[260px] max-w-sm ${classes}`}
    >
      {icon}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
