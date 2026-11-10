import { cn } from "@/lib/utils";
import { Droplet, Droplets, Pill, Syringe, Wind, FlaskConical, Package } from "lucide-react";

const FORMS: Record<string, { from: string; to: string; Icon: typeof Pill }> = {
  TABLET: { from: "from-indigo-500", to: "to-violet-500", Icon: Pill },
  CAPSULE: { from: "from-sky-500", to: "to-indigo-500", Icon: Pill },
  SYRUP: { from: "from-amber-400", to: "to-orange-500", Icon: FlaskConical },
  INJECTION: { from: "from-rose-500", to: "to-pink-500", Icon: Syringe },
  CREAM: { from: "from-emerald-400", to: "to-teal-500", Icon: Droplet },
  DROPS: { from: "from-cyan-400", to: "to-sky-500", Icon: Droplets },
  INHALER: { from: "from-teal-400", to: "to-emerald-500", Icon: Wind },
  OTHER: { from: "from-slate-400", to: "to-slate-600", Icon: Package },
};

/** Glossy 3D tile with an icon that matches the medicine's dosage form. */
export function PillIcon({ form, size = "md", className }: { form?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const f = FORMS[form ?? "OTHER"] ?? FORMS.OTHER;
  const dims = { sm: "h-9 w-9 rounded-xl", md: "h-12 w-12 rounded-2xl", lg: "h-16 w-16 rounded-3xl" }[size];
  const icon = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-gradient-to-br text-white",
        "shadow-[0_10px_20px_-8px_rgb(79_70_229/0.55),inset_0_1px_0_rgb(255_255_255/0.45)]",
        "transition-transform duration-500 group-hover/tilt:[transform:translateZ(20px)_rotateY(-12deg)]",
        f.from,
        f.to,
        dims,
        className
      )}
    >
      <span aria-hidden className="absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-white/30 blur-[3px]" />
      <f.Icon className={cn("relative", icon)} />
    </div>
  );
}
