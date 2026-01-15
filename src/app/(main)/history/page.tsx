"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatTime, formatDate } from "@/lib/utils";
import { History, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

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

export default function HistoryPage() {
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchHistory();
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
  const groupedIntakes = intakes.reduce((acc, intake) => {
    const date = new Date(intake.scheduledTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(intake);
    return acc;
  }, {} as Record<string, IntakeRecord[]>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TAKEN":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "SKIPPED":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case "MISSED":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TAKEN":
        return "text-green-600 bg-green-50";
      case "SKIPPED":
        return "text-gray-600 bg-gray-50";
      case "MISSED":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  // Calculate stats
  const totalIntakes = intakes.length;
  const takenCount = intakes.filter((i) => i.status === "TAKEN").length;
  const skippedCount = intakes.filter((i) => i.status === "SKIPPED").length;
  const missedCount = intakes.filter((i) => i.status === "MISSED").length;
  const adherenceRate = totalIntakes > 0 ? Math.round((takenCount / totalIntakes) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-gray-600">Your medicine intake history</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{adherenceRate}%</p>
            <p className="text-sm text-gray-600">Adherence Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{takenCount}</p>
            <p className="text-sm text-gray-600">Taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{skippedCount}</p>
            <p className="text-sm text-gray-600">Skipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{missedCount}</p>
            <p className="text-sm text-gray-600">Missed</p>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : intakes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No history found for this period</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIntakes)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([date, records]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-base">{formatDate(date)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {records
                      .sort(
                        (a, b) =>
                          new Date(a.scheduledTime).getTime() -
                          new Date(b.scheduledTime).getTime()
                      )
                      .map((intake) => (
                        <div
                          key={intake.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(intake.status)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {intake.patientMedicine.medicine.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTime(
                                  new Date(intake.scheduledTime)
                                    .toTimeString()
                                    .slice(0, 5)
                                )}
                                {intake.dosageTaken &&
                                  ` - ${intake.dosageTaken} ${intake.patientMedicine.unitType}`}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              intake.status
                            )}`}
                          >
                            {intake.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
