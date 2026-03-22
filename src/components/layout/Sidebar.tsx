"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Pill,
  History,
  Settings,
  Plus,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, color: "text-blue-600",   activeBg: "bg-blue-50",   activeText: "text-blue-700" },
  { href: "/medicines",     label: "My Medicines",  icon: Pill,            color: "text-purple-600", activeBg: "bg-purple-50", activeText: "text-purple-700" },
  { href: "/medicines/add", label: "Add Medicine",  icon: Plus,            color: "text-green-600",  activeBg: "bg-green-50",  activeText: "text-green-700" },
  { href: "/history",       label: "History",       icon: History,         color: "text-orange-600", activeBg: "bg-orange-50", activeText: "text-orange-700" },
  { href: "/settings",      label: "Settings",      icon: Settings,        color: "text-gray-600",   activeBg: "bg-gray-100",  activeText: "text-gray-800" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-sm",
          "transform transition-transform duration-200 ease-in-out",
          "lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close */}
          <div className="lg:hidden flex justify-end p-4 border-b border-gray-100">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
                    isActive
                      ? `${item.activeBg} ${item.activeText} font-semibold`
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? `${item.activeBg}` : "bg-gray-100 group-hover:bg-gray-200"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? item.color : "text-gray-500")} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", item.color.replace("text-", "bg-"))} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 px-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-gray-400">MedCare v1.0 — Online</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
