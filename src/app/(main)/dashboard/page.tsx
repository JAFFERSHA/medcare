"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pill, AlertTriangle, CheckCircle2, Clock, Package, CalendarDays, Plus, Check, X, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PillIcon } from "@/components/ui/PillIcon";
import { Loader } from "@/components/ui/Loader";
import { formatTime, cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface Medicine {
  id: string;
  currentStock: number;
  unitType: string;
  dosagePerIntake: number;
  timesPerDay: number;
  scheduleTimes: string[];
  reminderEnabled: boolean;
  daysRemaining: number | null;
  isLowStock: boolean;
  medicine: {
    id: string;
    name: string;
    dosageForm: string;
    strength: string | null;
  };
  intakes: {
    id: string;
    scheduledTime: string;
    status: string;
  }[];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const toast = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch("/api/medicines");
      const data = await res.json();
      setMedicines(data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const recordIntake = async (medicineId: string, scheduledTime: string, status: "TAKEN" | "SKIPPED") => {
    setBusyKey(`${medicineId}-${scheduledTime}`);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientMedicineId: medicineId, scheduledTime, status }),
      });
      if (res.ok) {
        if (status === "TAKEN") toast.success("Medicine marked as taken!");
        else toast.info("Medicine skipped");
      } else {
        toast.error(status === "TAKEN" ? "Failed to record intake" : "Failed to record skip");
      }
      await fetchMedicines();
    } catch {
      toast.error(status === "TAKEN" ? "Error recording intake" : "Error recording skip");
    } finally {
      setBusyKey(null);
    }
  };

  // Calculate stats
  const totalMedicines = medicines.length;
  const lowStockMedicines = medicines.filter((m) => m.isLowStock);
  const todaySchedule = medicines
    .flatMap((m) =>
      m.scheduleTimes.map((time) => {
        const [h, min] = time.split(":").map(Number);
        const d = new Date();
        d.setHours(h, min, 0, 0);
        return {
          ...m,
          time,
          scheduledTime: d.toISOString(),
          intake: m.intakes.find(
            (i) => new Date(i.scheduledTime).getHours() === h && new Date(i.scheduledTime).getMinutes() === min
          ),
        };
      })
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const completedToday = todaySchedule.filter((s) => s.intake?.status === "TAKEN").length;
  const pct = todaySchedule.length ? (completedToday / todaySchedule.length) * 100 : null;
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const nextDose = todaySchedule.find((s) => !s.intake && s.time >= nowHHMM) ?? todaySchedule.find((s) => !s.intake);

  if (loading) return <Loader label="Loading your medicines…" />;

  const stats = [
    { label: "Total medicines", value: totalMedicines, icon: Pill, tone: "from-indigo-500 to-violet-500" },
    { label: "Low stock", value: lowStockMedicines.length, icon: AlertTriangle, tone: "from-amber-400 to-orange-500" },
    { label: "Taken today", value: `${completedToday}/${todaySchedule.length}`, icon: CheckCircle2, tone: "from-emerald-400 to-teal-500" },
    { label: "Today's doses", value: todaySchedule.length, icon: CalendarDays, tone: "from-sky-400 to-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="bg-brand-gradient relative animate-fade-up overflow-hidden rounded-3xl p-6 text-white shadow-[0_30px_60px_-25px_rgb(79_70_229/0.7)] sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Sparkles className="h-4 w-4" />
              {greeting()}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {todaySchedule.length === 0
                ? "No doses scheduled today"
                : completedToday === todaySchedule.length
                  ? "All doses done today! 🎉"
                  : `${todaySchedule.length - completedToday} dose${todaySchedule.length - completedToday === 1 ? "" : "s"} left today`}
            </h1>
            {nextDose ? (
              <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md ring-1 ring-white/25">
                <Clock className="h-5 w-5" />
                <div className="leading-tight">
                  <p className="text-xs text-white/75">Next dose</p>
                  <p className="font-semibold">
                    {nextDose.medicine.name} · {formatTime(nextDose.time)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-white/80">Keep it up — consistency is the best medicine.</p>
            )}
          </div>
          <div className="self-center sm:self-auto">
            <ProgressRing value={pct} size={150} onDark sublabel="taken today" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <TiltCard key={s.label} className="p-4 sm:p-5">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", s.tone)}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">{s.label}</p>
          </TiltCard>
        ))}
      </div>

      {/* Empty State */}
      {medicines.length === 0 && (
        <Card className="animate-fade-up text-center">
          <CardContent className="flex flex-col items-center p-6">
            <PillIcon form="CAPSULE" size="lg" className="mb-4 animate-float" />
            <h3 className="text-lg font-semibold text-slate-900">No medicines added yet</h3>
            <p className="mb-5 mt-1 text-slate-500">Start by adding your medicines to track them</p>
            <Link href="/medicines/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {medicines.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Today's Schedule */}
          <Card className="animate-fade-up lg:col-span-3">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-600" />
                Today&apos;s Schedule
              </CardTitle>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {completedToday}/{todaySchedule.length} done
              </span>
            </CardHeader>
            <CardContent>
              {todaySchedule.length === 0 ? (
                <p className="py-6 text-center text-slate-500">No scheduled doses for today</p>
              ) : (
                <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[19px] before:top-3 before:w-px before:bg-slate-200">
                  {todaySchedule.map((schedule, idx) => {
                    const status = schedule.intake?.status;
                    const key = `${schedule.id}-${schedule.scheduledTime}`;
                    const isNext = nextDose && nextDose.id === schedule.id && nextDose.time === schedule.time;
                    return (
                      <li
                        key={`${schedule.id}-${schedule.time}-${idx}`}
                        className={cn(
                          "relative flex items-center gap-3 rounded-2xl p-2.5 pr-3 transition-all",
                          isNext ? "bg-brand-50/80 ring-1 ring-brand-200" : "hover:bg-white/70"
                        )}
                      >
                        <span
                          className={cn(
                            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                            status === "TAKEN"
                              ? "bg-emerald-500 text-white"
                              : status === "SKIPPED"
                                ? "bg-slate-300 text-white"
                                : "bg-white text-brand-600 shadow-sm"
                          )}
                        >
                          {status === "TAKEN" ? (
                            <Check className="h-5 w-5 animate-pop" />
                          ) : status === "SKIPPED" ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Pill className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-semibold text-slate-900", status === "SKIPPED" && "text-slate-400 line-through")}>
                            {schedule.medicine.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatTime(schedule.time)} · {schedule.dosagePerIntake} {schedule.unitType}
                          </p>
                        </div>
                        {status === "TAKEN" ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Taken</span>
                        ) : status === "SKIPPED" ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Skipped</span>
                        ) : (
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              size="sm"
                              loading={busyKey === key}
                              onClick={() => recordIntake(schedule.id, schedule.scheduledTime, "TAKEN")}
                            >
                              Take
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busyKey === key}
                              onClick={() => recordIntake(schedule.id, schedule.scheduledTime, "SKIPPED")}
                            >
                              Skip
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="animate-fade-up lg:col-span-2 [animation-delay:120ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockMedicines.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <p className="text-slate-500">All medicines have sufficient stock</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockMedicines.map((medicine) => {
                    const days = medicine.daysRemaining ?? 0;
                    const width = Math.max(6, Math.min(100, (days / 14) * 100));
                    return (
                      <div key={medicine.id} className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/60 p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <PillIcon form={medicine.medicine.dosageForm} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{medicine.medicine.name}</p>
                              <p className="text-xs font-medium text-orange-700">
                                {medicine.currentStock} {medicine.unitType} left
                                {medicine.daysRemaining !== null && ` · ${medicine.daysRemaining} days`}
                              </p>
                            </div>
                          </div>
                          <Link href={`/medicines/${medicine.id}`}>
                            <Button size="sm" variant="secondary">
                              Refill
                            </Button>
                          </Link>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-orange-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-1000"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
