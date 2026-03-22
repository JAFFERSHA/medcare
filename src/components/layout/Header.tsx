"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

interface HeaderProps {
  userName?: string | null;
  onMenuClick?: () => void;
}

export function Header({ userName, onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Left — Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2.5">
          <Image
            src="/icons/medcare-logo.svg"
            alt="MedCare"
            width={36}
            height={36}
            className="rounded-xl"
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-gray-900 text-base tracking-tight">MedCare</span>
            <span className="text-[10px] text-blue-500 font-medium hidden sm:block">
              Medicine Manager
            </span>
          </div>
        </div>
      </div>

      {/* Right — User avatar + Logout */}
      <div className="flex items-center gap-3">
        {userName && (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-gray-400">Welcome back</span>
              <span className="text-sm font-semibold text-gray-800">{userName}</span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
