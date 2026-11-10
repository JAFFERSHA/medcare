"use client";

import { useId } from "react";

interface ProgressRingProps {
  /** 0..100, or null for "no data" */
  value: number | null;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  /** Light ring for use on dark/gradient backgrounds */
  onDark?: boolean;
}

/** Circular progress tilted in 3D, gently floating. */
export function ProgressRing({ value, size = 140, stroke = 12, label, sublabel, onDark }: ProgressRingProps) {
  const gid = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className="perspective-1000" style={{ width: size, height: size }}>
      <div className="relative h-full w-full animate-float preserve-3d">
        <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_10px_18px_rgb(15_23_42/0.25)]">
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={onDark ? "#ffffff" : "#4f46e5"} />
              <stop offset="100%" stopColor={onDark ? "#a5f3fc" : "#0ea5e9"} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={onDark ? "rgb(255 255 255 / 0.18)" : "rgb(15 23 42 / 0.07)"}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#g${gid})`}
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center [transform:translateZ(30px)]">
          <span className={onDark ? "text-3xl font-bold text-white" : "text-3xl font-bold text-slate-900"}>
            {label ?? (value === null ? "—" : `${Math.round(pct)}%`)}
          </span>
          {sublabel && (
            <span className={onDark ? "text-xs font-medium text-white/75" : "text-xs font-medium text-slate-500"}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
