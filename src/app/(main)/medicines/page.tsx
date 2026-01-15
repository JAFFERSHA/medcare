"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import { Pill, Plus, AlertTriangle, Clock, Package } from "lucide-react";

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

export default function MedicinesPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medicines</h1>
          <p className="text-gray-600">Manage your medicine list</p>
        </div>
        <Link href="/medicines/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Medicine
          </Button>
        </Link>
      </div>

      {medicines.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No medicines added yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your medicines to start tracking them
            </p>
            <Link href="/medicines/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Medicine
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((medicine) => (
            <Link key={medicine.id} href={`/medicines/${medicine.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Pill className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {medicine.medicine.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {medicine.medicine.dosageForm}
                          {medicine.medicine.strength &&
                            ` - ${medicine.medicine.strength}`}
                        </p>
                      </div>
                    </div>
                    {medicine.isLowStock && (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>
                        {medicine.currentStock} {medicine.unitType}
                        {medicine.daysRemaining !== null && (
                          <span
                            className={
                              medicine.isLowStock
                                ? "text-orange-600 ml-1"
                                : "text-gray-500 ml-1"
                            }
                          >
                            ({medicine.daysRemaining} days left)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {medicine.timesPerDay}x daily -{" "}
                        {medicine.scheduleTimes.map(formatTime).join(", ")}
                      </span>
                    </div>
                  </div>

                  {medicine.isLowStock && (
                    <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">
                        Low stock - refill soon
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
