import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Lucide icon element shown in a 3D gradient tile */
  icon?: React.ReactNode;
  /** Shows a round back button linking here */
  backHref?: string;
  /** Right-side actions */
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon, backHref, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex animate-fade-up flex-wrap items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-3.5">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:-translate-x-0.5 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        {icon && (
          <div className="perspective-1000 hidden shrink-0 sm:block">
            <div className="bg-brand-gradient flex h-12 w-12 animate-float items-center justify-center rounded-2xl text-white shadow-[0_12px_24px_-8px_rgb(79_70_229/0.6)] preserve-3d">
              {icon}
            </div>
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
