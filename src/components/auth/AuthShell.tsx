"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { BellRing, PackageCheck, LineChart } from "lucide-react";

// three.js is only downloaded on the auth pages, after the form has rendered
const MedScene = dynamic(() => import("@/components/three/MedScene"), { ssr: false });

const features = [
  { icon: BellRing, title: "Smart reminders", text: "Push, SMS & email — right on time" },
  { icon: PackageCheck, title: "Stock alerts", text: "Know before you run out" },
  { icon: LineChart, title: "Dose history", text: "See how well you're doing" },
];

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Dark, immersive layout for login / password pages with the 3D scene. */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f2c] text-white">
      {/* background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] animate-blob rounded-full bg-indigo-600/40 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[30rem] w-[30rem] animate-blob rounded-full bg-sky-500/30 blur-[120px] [animation-delay:-5s]" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-violet-600/30 blur-[120px] [animation-delay:-10s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-8">
        {/* Hero / 3D */}
        <section className="relative flex flex-col lg:justify-center lg:py-12">
          <div className="flex items-center gap-3 px-6 pt-6 lg:absolute lg:left-8 lg:top-8 lg:p-0">
            <Image src="/icons/medcare-logo.svg" alt="MedCare" width={42} height={42} className="rounded-xl shadow-lg shadow-indigo-900/50" priority />
            <span className="text-lg font-bold tracking-tight">MedCare</span>
          </div>

          <div className="relative h-[34vh] min-h-[220px] sm:h-[40vh] lg:h-[480px]">
            <MedScene className="absolute inset-0" />
          </div>

          <div className="hidden px-2 lg:block">
            <h2 className="max-w-lg text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
              Your medicines,{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                perfectly on time.
              </span>
            </h2>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 [perspective:900px]">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition-transform duration-500 hover:[transform:rotateX(8deg)_translateY(-4px)]"
                  style={{ animationDelay: `${300 + i * 120}ms` }}
                >
                  <f.icon className="h-5 w-5 text-sky-300" />
                  <p className="mt-2 text-sm font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-xs text-white/60">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="relative z-10 -mt-8 flex items-start justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-0">
          <div className="w-full max-w-md animate-fade-up rounded-[28px] border border-white/60 bg-white/95 p-6 text-slate-900 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.55)] backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
