import { LayoutDashboard, Pill, History, Settings, Plus } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/medicines", label: "My Medicines", short: "Medicines", icon: Pill },
  { href: "/medicines/add", label: "Add Medicine", short: "Add", icon: Plus },
  { href: "/history", label: "History", short: "History", icon: History },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
];

/** "/medicines" stays active on a medicine's detail page, but not on "/medicines/add". */
export function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/medicines") return pathname.startsWith("/medicines/") && pathname !== "/medicines/add";
  return false;
}
