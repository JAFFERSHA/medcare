"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatTime, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Pill,
  Package,
  Clock,
  History,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

interface Medicine {
  id: string;
  currentStock: number;
  unitType: string;
  dosagePerIntake: number;
  timesPerDay: number;
  scheduleTimes: string[];
  frequency: string;
  lowStockThreshold: number;
  reminderEnabled: boolean;
  stockAlertEnabled: boolean;
  notes: string | null;
  daysRemaining: number | null;
  isLowStock: boolean;
  medicine: {
    id: string;
    name: string;
    genericName: string | null;
    dosageForm: string;
    strength: string | null;
  };
  intakes: {
    id: string;
    scheduledTime: string;
    takenAt: string | null;
    status: string;
    dosageTaken: number | null;
  }[];
  stockHistory: {
    id: string;
    changeType: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    notes: string | null;
    createdAt: string;
  }[];
}

export default function MedicineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [addStockAmount, setAddStockAmount] = useState(0);
  const [addingStock, setAddingStock] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchMedicine();
  }, [params.id]);

  const fetchMedicine = async () => {
    try {
      const res = await fetch(`/api/medicines/${params.id}`);
      if (!res.ok) {
        router.push("/medicines");
        return;
      }
      const data = await res.json();
      setMedicine(data);
    } catch (error) {
      console.error("Error fetching medicine:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (addStockAmount <= 0) return;
    setAddingStock(true);

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientMedicineId: params.id,
          quantity: addStockAmount,
          notes: "Stock refill",
        }),
      });
      if (res.ok) {
        toast.success(`Added ${addStockAmount} units to stock!`);
        setAddStockAmount(0);
        fetchMedicine();
      } else {
        toast.error("Failed to add stock");
      }
    } catch {
      toast.error("Error adding stock");
    } finally {
      setAddingStock(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/medicines/${params.id}`, { method: "DELETE" });
      toast.success("Medicine removed");
      router.push("/medicines");
    } catch {
      toast.error("Failed to remove medicine");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Medicine not found</p>
        <Link href="/medicines">
          <Button className="mt-4">Go to Medicines</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/medicines">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {medicine.medicine.name}
            </h1>
            <p className="text-gray-600">
              {medicine.medicine.dosageForm}
              {medicine.medicine.strength && ` - ${medicine.medicine.strength}`}
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 mb-4">
              Are you sure you want to remove this medicine?
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
              >
                Yes, Remove
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Stock Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicine.currentStock}{" "}
                  <span className="text-base font-normal text-gray-500">
                    {medicine.unitType}
                  </span>
                </p>
              </div>
              {medicine.isLowStock && (
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              )}
            </div>

            {medicine.daysRemaining !== null && (
              <div
                className={`p-3 rounded-lg ${
                  medicine.isLowStock
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    medicine.isLowStock ? "text-orange-700" : "text-green-700"
                  }`}
                >
                  {medicine.daysRemaining} days of supply remaining
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Add Stock</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={addStockAmount || ""}
                  onChange={(e) =>
                    setAddStockAmount(parseInt(e.target.value) || 0)
                  }
                  placeholder="Quantity"
                />
                <Button
                  onClick={handleAddStock}
                  loading={addingStock}
                  disabled={addStockAmount <= 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Frequency</p>
                <p className="font-medium text-gray-900">{medicine.frequency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dosage</p>
                <p className="font-medium text-gray-900">
                  {medicine.dosagePerIntake} {medicine.unitType}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Schedule Times</p>
              <div className="flex flex-wrap gap-2">
                {medicine.scheduleTimes.map((time, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {formatTime(time)}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    medicine.reminderEnabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  Reminders {medicine.reminderEnabled ? "enabled" : "disabled"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    medicine.stockAlertEnabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  Stock alerts{" "}
                  {medicine.stockAlertEnabled ? "enabled" : "disabled"}
                </span>
              </div>
            </div>

            {medicine.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-900">{medicine.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Intake History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Recent Intake History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicine.intakes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No intake history yet</p>
          ) : (
            <div className="space-y-2">
              {medicine.intakes.slice(0, 10).map((intake) => (
                <div
                  key={intake.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        intake.status === "TAKEN"
                          ? "bg-green-500"
                          : intake.status === "SKIPPED"
                          ? "bg-gray-400"
                          : intake.status === "MISSED"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(intake.scheduledTime)} at{" "}
                        {formatTime(
                          new Date(intake.scheduledTime)
                            .toTimeString()
                            .slice(0, 5)
                        )}
                      </p>
                      {intake.takenAt && (
                        <p className="text-xs text-gray-500">
                          Taken at {formatTime(new Date(intake.takenAt).toTimeString().slice(0, 5))}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      intake.status === "TAKEN"
                        ? "text-green-600"
                        : intake.status === "SKIPPED"
                        ? "text-gray-500"
                        : intake.status === "MISSED"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {intake.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Stock History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicine.stockHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No stock history yet</p>
          ) : (
            <div className="space-y-2">
              {medicine.stockHistory.map((history) => (
                <div
                  key={history.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {history.changeType}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(history.createdAt)}
                      {history.notes && ` - ${history.notes}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        history.quantity > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {history.quantity > 0 ? "+" : ""}
                      {history.quantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      {history.previousStock} → {history.newStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
