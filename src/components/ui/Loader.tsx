import { cn } from "@/lib/utils";

/** A 3D capsule that spins while content loads. */
export function Loader({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex min-h-[360px] flex-col items-center justify-center gap-5", className)}>
      <div className="perspective-1000">
        <div className="relative h-16 w-7 animate-spin-3d preserve-3d">
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-brand-400 to-brand-600 shadow-inner" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-gradient-to-b from-white to-slate-200 shadow-inner" />
          <div className="absolute inset-x-1 top-1.5 h-5 rounded-full bg-white/50 blur-[2px]" />
        </div>
      </div>
      <div className="h-2 w-10 rounded-full bg-slate-900/10 blur-sm" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
