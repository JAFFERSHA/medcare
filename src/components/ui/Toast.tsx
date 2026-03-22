"use client";

import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast, ToastType } from "@/contexts/ToastContext";

const config: Record<ToastType, { icon: React.ReactNode; classes: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-green-50 border-green-200 text-green-800",
  },
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-red-50 border-red-200 text-red-800",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    classes: "bg-orange-50 border-orange-200 text-orange-800",
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    classes: "bg-blue-50 border-blue-200 text-blue-800",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon, classes } = config[toast.type];
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[280px] max-w-sm ${classes}`}
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
