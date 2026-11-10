"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, isNavActive } from "./nav";

/** Thumb-friendly tab bar for phones, with a raised 3D "Add" button in the middle. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="glass mx-auto flex max-w-md !bg-white/95 items-end justify-between rounded-[22px] px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          const isAdd = item.href === "/medicines/add";

          if (isAdd) {
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} className="perspective-1000 -mt-7 px-1">
                <span
                  className={cn(
                    "bg-brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-white ring-4 ring-white",
                    "shadow-[0_14px_28px_-8px_rgb(79_70_229/0.7)] transition-transform duration-300",
                    "[transform:rotateX(14deg)] active:[transform:rotateX(0deg)_scale(0.94)]",
                    active && "[transform:rotateX(0deg)]"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[58px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10.5px] font-medium transition-colors",
                active ? "text-brand-600" : "text-slate-500"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-10 items-center justify-center rounded-full transition-all duration-300",
                  active && "bg-brand-100 scale-105"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
