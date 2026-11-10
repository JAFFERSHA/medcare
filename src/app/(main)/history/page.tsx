"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TiltCard } from "@/components/ui/TiltCard";
import { Loader } from "@/components/ui/Loader";
import { formatTime, formatDate, cn } from "@/lib/utils";

interface IntakeRecord {
  id: string;
  scheduledTime: string;
  takenAt: string | null;
  status: string;
  dosageTaken: number | null;
  notes: string | null;
  patientMedicine: {
    unitType: string;
    medicine: {
      name: string;
      dosageForm: string;
    };
  };
}

const STATUS: Record<string, { label: string; icon: typeof Clock; dot: string; chip: string }> = {
  TAKEN: { label: "Taken", icon: CheckCircle2, dot: "bg-emerald-500 text-white", chip: "bg-emerald-50 text-emerald-700" },
  SKIPPED: { label: "Skipped", icon: XCircle, dot: "bg-slate-300 text-white", chip: "bg-slate-100 text-slate-600" },
  MISSED: { label: "Missed", icon: AlertCircle, dot: "bg-rose-500 text-white", chip: "bg-rose-50 text-rose-700" },
  PENDING: { label: "Pending", icon: Clock, dot: "bg-brand-100 text-brand-600", chip: "bg-brand-50 text-brand-700" },
};

const RANGES = [7, 14, 30, 90];

export default function HistoryPage() {
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/intake?days=${days}`);
      const data = await res.json();
      setIntakes(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group intakes by date
  const groupedIntakes = intakes.reduce(
    (acc, intake) => {
      const date = new Date(intake.scheduledTime).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(intake);
      return acc;
    },
    {} as Record<string, IntakeRecord[]>
  );

  // Calculate stats (only count scheduled doses, not pending ones, for adherence)
  const totalIntakes = intakes.filter((i) => i.status !== "PENDING").length;
  const takenCount = intakes.filter((i) => i.status === "TAKEN").length;
  const skippedCount = intakes.filter((i) => i.status === "SKIPPED").length;
  const missedCount = intakes.filter((i) => i.status === "MISSED").length;
  const adherenceRate = totalIntakes > 0 ? Math.round((takenCount / totalIntakes) * 100) : null;

  const tiles = [
    { label: "Taken", value: takenCount, tone: "from-emerald-400 to-teal-500", icon: CheckCircle2 },
    { label: "Skipped", value: skippedCount, tone: "from-slate-300 to-slate-500", icon: XCircle },
    { label: "Missed", value: missedCount, tone: "from-rose-400 to-red-500", icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="History" subtitle="Your medicine intake history" icon={<History className="h-6 w-6" />} />

      {/* Range selector */}
      <div role="tablist" aria-label="Period" className="glass flex w-full animate-fade-up gap-1 rounded-2xl p-1 sm:w-fit">
        {RANGES.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={days === r}
            onClick={() => setDays(r)}
            className={cn(
              "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:flex-none",
              days === r ? "bg-brand-gradient text-white shadow-md" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {r} days
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <Card className="flex animate-fade-up items-center justify-center gap-5 p-5 sm:flex-col sm:gap-2">
          <ProgressRing value={adherenceRate} size={130} stroke={11} sublabel="adherence" />
          <p className="max-w-[10rem] text-sm text-slate-500 sm:text-center">
            {adherenceRate === null ? "No recorded doses yet" : `${takenCount} of ${totalIntakes} doses taken`}
          </p>
        </Card>
        <div className="stagger grid grid-cols-3 gap-3 sm:gap-4">
          {tiles.map((t) => (
            <TiltCard key={t.label} className="flex flex-col justify-center p-4 sm:p-5">
              <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", t.tone)}>
                <t.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{t.value}</p>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">{t.label}</p>
            </TiltCard>
          ))}
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <Loader className="min-h-[220px]" label="Loading history…" />
      ) : totalIntakes === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <span className="mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <History className="h-7 w-7" />
            </span>
            <p className="font-semibold text-slate-700">No recorded doses in this period</p>
            <p className="mt-1 text-sm text-slate-500">Mark doses as Taken or Skipped on the Dashboard to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="stagger space-y-4">
          {Object.entries(groupedIntakes)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([date, records]) => {
              const taken = records.filter((r) => r.status === "TAKEN").length;
              return (
                <Card key={date} className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{formatDate(date)}</h3>
                    <span className="text-xs font-medium text-slate-500">
                      {taken}/{records.length} taken
                    </span>
                  </div>
                  <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-slate-200">
                    {records
                      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                      .map((intake) => {
                        const s = STATUS[intake.status] ?? STATUS.PENDING;
                        return (
                          <li key={intake.id} className="relative flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/70">
                            <span className={cn("relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white", s.dot)}>
                              <s.icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-900">{intake.patientMedicine.medicine.name}</p>
                              <p className="text-sm text-slate-500">
                                {formatTime(new Date(intake.scheduledTime).toTimeString().slice(0, 5))}
                                {intake.dosageTaken && ` · ${intake.dosageTaken} ${intake.patientMedicine.unitType}`}
                              </p>
                            </div>
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.chip)}>{s.label}</span>
                          </li>
                        );
                      })}
                  </ol>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
