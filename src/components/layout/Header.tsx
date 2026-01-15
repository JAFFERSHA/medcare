"use client";

import { useRouter } from "next/navigation";
import { Pill, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <Pill className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">MedCare</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {userName && (
          <span className="text-sm text-gray-600 hidden sm:block">
            Hello, {userName}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
