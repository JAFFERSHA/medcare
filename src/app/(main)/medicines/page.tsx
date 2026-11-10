"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pill, Plus, AlertTriangle, Clock, Search, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { TiltCard } from "@/components/ui/TiltCard";
import { PillIcon } from "@/components/ui/PillIcon";
import { Loader } from "@/components/ui/Loader";
import { formatTime, cn } from "@/lib/utils";

interface Medicine {
  id: string;
  currentStock: number;
  unitType: string;
  dosagePerIntake: number;
  timesPerDay: number;
  scheduleTimes: string[];
  daysRemaining: number | null;
  isLowStock: boolean;
  medicine: {
    id: string;
    name: string;
    dosageForm: string;
    strength: string | null;
  };
}

const prettyForm = (f: string) => f.charAt(0) + f.slice(1).toLowerCase();

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  if (loading) return <Loader label="Loading your medicines…" />;

  const q = query.trim().toLowerCase();
  const shown = q ? medicines.filter((m) => m.medicine.name.toLowerCase().includes(q)) : medicines;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Medicines"
        subtitle={`${medicines.length} medicine${medicines.length === 1 ? "" : "s"} in your list`}
        icon={<Pill className="h-6 w-6" />}
        action={
          <Link href="/medicines/add" className="hidden sm:block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          </Link>
        }
      />

      {medicines.length > 3 && (
        <div className="relative animate-fade-up">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your medicines"
            aria-label="Search your medicines"
            className="glass w-full rounded-2xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
      )}

      {medicines.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <PillIcon form="TABLET" size="lg" className="mb-4 animate-float" />
            <h3 className="text-lg font-semibold text-slate-900">No medicines added yet</h3>
            <p className="mb-5 mt-1 text-slate-500">Add your medicines to start tracking them</p>
            <Link href="/medicines/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Medicine
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-slate-500">No medicines match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((medicine) => {
            const days = medicine.daysRemaining;
            const stockPct = days === null ? 100 : Math.max(5, Math.min(100, (days / 30) * 100));
            return (
              <Link key={medicine.id} href={`/medicines/${medicine.id}`} className="block rounded-2xl">
                <TiltCard className={cn("p-5", medicine.isLowStock && "ring-1 ring-orange-200")}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PillIcon form={medicine.medicine.dosageForm} />
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">{medicine.medicine.name}</h3>
                        <p className="text-sm text-slate-500">
                          {prettyForm(medicine.medicine.dosageForm)}
                          {medicine.medicine.strength && ` · ${medicine.medicine.strength}`}
                        </p>
                      </div>
                    </div>
                    {medicine.isLowStock ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                        <AlertTriangle className="h-3 w-3" />
                        Low
                      </span>
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover/tilt:translate-x-1 group-hover/tilt:text-brand-500" />
                    )}
                  </div>

                  {/* stock */}
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-slate-800">
                        {medicine.currentStock} <span className="font-normal text-slate-500">{medicine.unitType}</span>
                      </span>
                      {days !== null && (
                        <span className={cn("text-xs font-medium", medicine.isLowStock ? "text-orange-600" : "text-slate-500")}>
                          {days} days left
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-1000",
                          medicine.isLowStock ? "bg-gradient-to-r from-rose-500 to-orange-400" : "bg-gradient-to-r from-brand-500 to-sky-400"
                        )}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>

                  {/* schedule */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <Clock className="mr-0.5 h-3.5 w-3.5 text-slate-400" />
                    {medicine.scheduleTimes.length === 0 ? (
                      <span className="text-xs text-slate-500">As needed</span>
                    ) : (
                      medicine.scheduleTimes.map((t) => (
                        <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {formatTime(t)}
                        </span>
                      ))
                    )}
                  </div>
                </TiltCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
