"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

const DOSAGE_FORMS = [
  { value: "TABLET", label: "Tablet" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "SYRUP", label: "Syrup" },
  { value: "INJECTION", label: "Injection" },
  { value: "CREAM", label: "Cream" },
  { value: "DROPS", label: "Drops" },
  { value: "INHALER", label: "Inhaler" },
  { value: "OTHER", label: "Other" },
];

const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "AS_NEEDED", label: "As Needed" },
];

export default function AddMedicinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    dosageForm: "TABLET",
    strength: "",
    currentStock: 0,
    unitType: "tablets",
    dosagePerIntake: 1,
    frequency: "DAILY",
    timesPerDay: 1,
    scheduleTimes: ["08:00"],
    lowStockThreshold: 7,
    reminderEnabled: true,
    stockAlertEnabled: true,
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseFloat(value) || 0
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const addScheduleTime = () => {
    if (formData.scheduleTimes.length < 10) {
      setFormData((prev) => ({
        ...prev,
        scheduleTimes: [...prev.scheduleTimes, "12:00"],
        timesPerDay: prev.timesPerDay + 1,
      }));
    }
  };

  const removeScheduleTime = (index: number) => {
    if (formData.scheduleTimes.length > 1) {
      setFormData((prev) => ({
        ...prev,
        scheduleTimes: prev.scheduleTimes.filter((_, i) => i !== index),
        timesPerDay: prev.timesPerDay - 1,
      }));
    }
  };

  const updateScheduleTime = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.map((t, i) => (i === index ? value : t)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add medicine");
        return;
      }

      router.push("/medicines");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/medicines">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-gray-600">Add a new medicine to track</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Medicine Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Medicine Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Paracetamol"
              required
            />

            <Input
              label="Generic Name"
              name="genericName"
              value={formData.genericName}
              onChange={handleChange}
              placeholder="e.g., Acetaminophen"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage Form
                </label>
                <select
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DOSAGE_FORMS.map((form) => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Strength"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                placeholder="e.g., 500mg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Info */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current Stock *"
                name="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={handleChange}
                required
              />

              <Input
                label="Unit Type"
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                placeholder="e.g., tablets, ml"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Dosage Per Intake"
                name="dosagePerIntake"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.dosagePerIntake}
                onChange={handleChange}
              />

              <Input
                label="Low Stock Alert (days)"
                name="lowStockThreshold"
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Times *
              </label>
              <div className="space-y-2">
                {formData.scheduleTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateScheduleTime(index, e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.scheduleTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleTime(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addScheduleTime}
                className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add another time
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="reminderEnabled"
                  checked={formData.reminderEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable medicine reminders
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="stockAlertEnabled"
                  checked={formData.stockAlertEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable low stock alerts
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this medicine..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" loading={loading} className="flex-1">
            Add Medicine
          </Button>
          <Link href="/medicines" className="flex-1">
            <Button type="button" variant="secondary" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
