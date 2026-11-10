"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  userName?: string | null;
  /** Kept for compatibility; navigation on phones now uses the bottom tab bar */
  onMenuClick?: () => void;
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const initials = userName
    ? userName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 lg:px-6">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-3 py-2.5 sm:px-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="perspective-1000">
            <Image
              src="/icons/medcare-logo.svg"
              alt="MedCare"
              width={38}
              height={38}
              className="rounded-xl shadow-md transition-transform duration-500 hover:[transform:rotateY(180deg)]"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900">
              Med<span className="text-gradient">Care</span>
            </span>
            <span className="hidden text-[11px] font-medium text-slate-500 sm:block">{today}</span>
          </div>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {userName && (
            <div className="flex items-center gap-2.5">
              <div className="hidden flex-col items-end leading-tight sm:flex">
                <span className="text-[11px] text-slate-400">Welcome back</span>
                <span className="text-sm font-semibold text-slate-800">{userName}</span>
              </div>
              <div className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_6px_14px_-4px_rgb(79_70_229/0.6)] ring-2 ring-white">
                {initials}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
