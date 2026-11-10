"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AlarmModal } from "@/components/ui/AlarmModal";

interface User {
  id: string;
  name: string | null;
  mobile: string;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        // the API answers { user: {...} }
        if (!data.error) {
          setUser(data.user ?? data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* animated soft background */}
      <div aria-hidden className="mesh-bg">
        <div className="absolute -right-24 -top-24 h-80 w-80 animate-blob rounded-full bg-brand-300/25 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-96 w-96 animate-blob rounded-full bg-sky-300/25 blur-3xl [animation-delay:-6s]" />
      </div>

      <AlarmModal />
      <Header userName={user?.name} />
      <div className="mx-auto flex max-w-7xl gap-6 pt-4">
        <Sidebar />
        <main className="w-full min-w-0 flex-1 px-4 pb-32 lg:pb-10 lg:pr-6 lg:pl-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
