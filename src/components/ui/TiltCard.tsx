"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum tilt in degrees */
  max?: number;
  children: React.ReactNode;
}

/**
 * A glass card that tilts in 3D toward the pointer, with a soft moving glare.
 * Only reacts to a real mouse/pen (not touch) and does nothing when the user prefers reduced motion.
 */
export function TiltCard({ max = 8, className, children, ...props }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width; // 0..1
      const py = (clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(px - 0.5) * 2 * max}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * 2 * max}deg`);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
      el.style.setProperty("--glare", "1");
    });
  };

  return (
    <div className="perspective-1000 h-full">
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        className={cn(
          "glass group/tilt relative h-full overflow-hidden rounded-2xl preserve-3d",
          "transition-[transform,box-shadow] duration-300 ease-out will-change-transform",
          "[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
          "hover:shadow-[0_24px_50px_-20px_rgb(79_70_229/0.35)]",
          className
        )}
        {...props}
      >
        {/* glare */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: "var(--glare, 0)",
            background:
              "radial-gradient(600px circle at var(--gx,50%) var(--gy,50%), rgb(255 255 255 / 0.55), transparent 40%)",
          }}
        />
        <div className="relative [transform:translateZ(24px)]">{children}</div>
      </div>
    </div>
  );
}
