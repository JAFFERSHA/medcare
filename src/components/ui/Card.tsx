import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6 transition-shadow duration-300 hover:shadow-[0_18px_40px_-18px_rgb(15_23_42/0.18)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-slate-900", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn(className)}>{children}</div>;
}
