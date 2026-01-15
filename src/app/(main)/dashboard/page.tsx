"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import {
  Pill,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  Plus,
} from "lucide-react";
import Link from "next/link";

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

export default function DashboardPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleTakeMedicine = async (medicineId: string, scheduledTime: string) => {
    try {
      await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientMedicineId: medicineId,
          scheduledTime,
          status: "TAKEN",
        }),
      });
      fetchMedicines();
    } catch (error) {
      console.error("Error recording intake:", error);
    }
  };

  const handleSkipMedicine = async (medicineId: string, scheduledTime: string) => {
    try {
      await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientMedicineId: medicineId,
          scheduledTime,
          status: "SKIPPED",
        }),
      });
      fetchMedicines();
    } catch (error) {
      console.error("Error recording intake:", error);
    }
  };

  // Calculate stats
  const totalMedicines = medicines.length;
  const lowStockMedicines = medicines.filter((m) => m.isLowStock);
  const todaySchedule = medicines.flatMap((m) =>
    m.scheduleTimes.map((time) => ({
      ...m,
      time,
      scheduledTime: new Date(
        new Date().toDateString() + " " + time
      ).toISOString(),
      intake: m.intakes.find(
        (i) =>
          new Date(i.scheduledTime).getHours() === parseInt(time.split(":")[0]) &&
          new Date(i.scheduledTime).getMinutes() === parseInt(time.split(":")[1])
      ),
    }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const completedToday = todaySchedule.filter(
    (s) => s.intake?.status === "TAKEN"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Your medicine overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Medicines</p>
                <p className="text-2xl font-bold text-blue-700">{totalMedicines}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-700">
                  {lowStockMedicines.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Taken Today</p>
                <p className="text-2xl font-bold text-green-700">
                  {completedToday}/{todaySchedule.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Today&apos;s Doses</p>
                <p className="text-2xl font-bold text-purple-700">
                  {todaySchedule.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {medicines.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No medicines added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by adding your medicines to track them
            </p>
            <Link href="/medicines/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {medicines.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Today&apos;s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedule.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No scheduled doses for today
                </p>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((schedule, idx) => (
                    <div
                      key={`${schedule.id}-${schedule.time}-${idx}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            schedule.intake?.status === "TAKEN"
                              ? "bg-green-500"
                              : schedule.intake?.status === "SKIPPED"
                              ? "bg-gray-400"
                              : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {schedule.medicine.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTime(schedule.time)} -{" "}
                            {schedule.dosagePerIntake} {schedule.unitType}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {schedule.intake?.status === "TAKEN" ? (
                          <span className="text-sm text-green-600 font-medium">
                            Taken
                          </span>
                        ) : schedule.intake?.status === "SKIPPED" ? (
                          <span className="text-sm text-gray-500">Skipped</span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleTakeMedicine(
                                  schedule.id,
                                  schedule.scheduledTime
                                )
                              }
                            >
                              Take
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleSkipMedicine(
                                  schedule.id,
                                  schedule.scheduledTime
                                )
                              }
                            >
                              Skip
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockMedicines.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  All medicines have sufficient stock
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {medicine.medicine.name}
                        </p>
                        <p className="text-sm text-orange-600">
                          {medicine.currentStock} {medicine.unitType} left (
                          {medicine.daysRemaining} days)
                        </p>
                      </div>
                      <Link href={`/medicines/${medicine.id}`}>
                        <Button size="sm" variant="secondary">
                          Refill
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
