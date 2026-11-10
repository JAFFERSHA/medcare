"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, isNavActive } from "./nav";

/** Desktop navigation (phones use BottomNav). */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[84px] hidden h-[calc(100vh-100px)] w-64 shrink-0 pl-6 lg:block">
      <div className="glass flex h-full flex-col rounded-2xl p-3">
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-brand-gradient font-semibold text-white shadow-[0_10px_22px_-10px_rgb(79_70_229/0.8)]"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                    active ? "bg-white/20" : "bg-slate-900/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 rounded-xl bg-gradient-to-br from-brand-50 to-sky-50 p-3.5">
          <p className="text-xs font-semibold text-slate-700">Never miss a dose</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            Turn on push reminders in Settings to get alerts on this device.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-400">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
