"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Plus, X, Info } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

// ── Dosage form metadata ──────────────────────────────────────────────────────
const DOSAGE_FORM_CONFIG = {
  TABLET: {
    label: "Tablet",
    emoji: "💊",
    color: "blue",
    unitOptions: ["tablets", "caplets"],
    defaultUnit: "tablets",
    defaultDosage: 1,
    strengthPlaceholder: "e.g., 500mg, 10mg",
    dosagePlaceholder: "e.g., 1",
    tip: "Usually swallowed whole with water. Common forms: round, oblong.",
  },
  CAPSULE: {
    label: "Capsule",
    emoji: "💊",
    color: "purple",
    unitOptions: ["capsules", "softgels", "gelcaps"],
    defaultUnit: "capsules",
    defaultDosage: 1,
    strengthPlaceholder: "e.g., 250mg, 500mg",
    dosagePlaceholder: "e.g., 1",
    tip: "Swallow whole — do not crush or chew. Can be hard or soft gel.",
  },
  SYRUP: {
    label: "Syrup",
    emoji: "🧪",
    color: "orange",
    unitOptions: ["ml", "teaspoons", "tablespoons"],
    defaultUnit: "ml",
    defaultDosage: 10,
    strengthPlaceholder: "e.g., 250mg/5ml, 125mg/5ml",
    dosagePlaceholder: "e.g., 10 (ml)",
    tip: "Measure carefully with a measuring spoon. Shake well before use.",
  },
  INJECTION: {
    label: "Injection",
    emoji: "💉",
    color: "red",
    unitOptions: ["ml", "vials", "ampoules", "units (IU)"],
    defaultUnit: "ml",
    defaultDosage: 1,
    strengthPlaceholder: "e.g., 100mg/ml, 40IU/ml",
    dosagePlaceholder: "e.g., 1 (ml)",
    tip: "Administered subcutaneously, intramuscularly or intravenously. Follow doctor's instructions.",
  },
  CREAM: {
    label: "Cream",
    emoji: "🧴",
    color: "green",
    unitOptions: ["applications", "grams", "fingertip units"],
    defaultUnit: "applications",
    defaultDosage: 1,
    strengthPlaceholder: "e.g., 1%, 0.5%, 2.5%",
    dosagePlaceholder: "e.g., 1 (application)",
    tip: "Apply a thin layer to the affected area. Wash hands before and after.",
  },
  DROPS: {
    label: "Drops",
    emoji: "💧",
    color: "cyan",
    unitOptions: ["drops", "ml"],
    defaultUnit: "drops",
    defaultDosage: 3,
    strengthPlaceholder: "e.g., 0.5%, 1mg/drop",
    dosagePlaceholder: "e.g., 3 (drops)",
    tip: "Eye/ear/nose drops. Tilt head appropriately. Avoid touching dropper tip.",
  },
  INHALER: {
    label: "Inhaler",
    emoji: "💨",
    color: "indigo",
    unitOptions: ["puffs", "doses", "inhalations"],
    defaultUnit: "puffs",
    defaultDosage: 2,
    strengthPlaceholder: "e.g., 100mcg/puff, 200mcg",
    dosagePlaceholder: "e.g., 2 (puffs)",
    tip: "Shake well before use. Breathe out fully before inhaling. Hold breath 10 seconds after.",
  },
  OTHER: {
    label: "Other",
    emoji: "🔵",
    color: "gray",
    unitOptions: ["units", "pieces", "patches", "suppositories", "lozenges"],
    defaultUnit: "units",
    defaultDosage: 1,
    strengthPlaceholder: "e.g., 500mg, 10IU",
    dosagePlaceholder: "e.g., 1",
    tip: "Follow the instructions provided by your doctor or pharmacist.",
  },
} as const;

type DosageFormKey = keyof typeof DOSAGE_FORM_CONFIG;

const COLOR_CLASSES: Record<string, { card: string; selected: string; badge: string }> = {
  blue:   { card: "hover:border-blue-300 hover:bg-blue-50",   selected: "border-blue-500 bg-blue-50 ring-2 ring-blue-300",   badge: "bg-blue-100 text-blue-700" },
  purple: { card: "hover:border-purple-300 hover:bg-purple-50", selected: "border-purple-500 bg-purple-50 ring-2 ring-purple-300", badge: "bg-purple-100 text-purple-700" },
  orange: { card: "hover:border-orange-300 hover:bg-orange-50", selected: "border-orange-500 bg-orange-50 ring-2 ring-orange-300", badge: "bg-orange-100 text-orange-700" },
  red:    { card: "hover:border-red-300 hover:bg-red-50",     selected: "border-red-500 bg-red-50 ring-2 ring-red-300",     badge: "bg-red-100 text-red-700" },
  green:  { card: "hover:border-green-300 hover:bg-green-50", selected: "border-green-500 bg-green-50 ring-2 ring-green-300", badge: "bg-green-100 text-green-700" },
  cyan:   { card: "hover:border-cyan-300 hover:bg-cyan-50",   selected: "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300",   badge: "bg-cyan-100 text-cyan-700" },
  indigo: { card: "hover:border-indigo-300 hover:bg-indigo-50", selected: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300", badge: "bg-indigo-100 text-indigo-700" },
  gray:   { card: "hover:border-gray-300 hover:bg-gray-50",   selected: "border-gray-500 bg-gray-50 ring-2 ring-gray-300",   badge: "bg-gray-100 text-gray-700" },
};

const FREQUENCIES = [
  { value: "DAILY",     label: "Daily" },
  { value: "WEEKLY",    label: "Weekly" },
  { value: "MONTHLY",   label: "Monthly" },
  { value: "AS_NEEDED", label: "As Needed" },
];

export default function AddMedicinePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    dosageForm: "TABLET" as DosageFormKey,
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

  const selectedConfig = DOSAGE_FORM_CONFIG[formData.dosageForm];
  const colors = COLOR_CLASSES[selectedConfig.color];

  // ── When dosage form changes → sync unit & dosage defaults ──────────────────
  const handleDosageFormChange = (form: DosageFormKey) => {
    const cfg = DOSAGE_FORM_CONFIG[form];
    setFormData((prev) => ({
      ...prev,
      dosageForm: form,
      unitType: cfg.defaultUnit,
      dosagePerIntake: cfg.defaultDosage,
    }));
  };

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
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add medicine");
        return;
      }
      toast.success("Medicine added successfully!");
      router.push("/medicines");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/medicines">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-gray-600">Add a new medicine to your tracker</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Medicine Details ── */}
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
              placeholder="e.g., Paracetamol, Amoxicillin"
              required
            />
            <Input
              label="Generic Name"
              name="genericName"
              value={formData.genericName}
              onChange={handleChange}
              placeholder="e.g., Acetaminophen"
            />

            {/* ── Dosage Form — Visual Card Grid ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dosage Form *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(DOSAGE_FORM_CONFIG) as DosageFormKey[]).map((form) => {
                  const cfg = DOSAGE_FORM_CONFIG[form];
                  const c = COLOR_CLASSES[cfg.color];
                  const isSelected = formData.dosageForm === form;
                  return (
                    <button
                      key={form}
                      type="button"
                      onClick={() => handleDosageFormChange(form)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                        isSelected ? c.selected : "border-gray-200 bg-white " + c.card
                      }`}
                    >
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span className={`text-xs font-medium ${isSelected ? "" : "text-gray-600"}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tip for selected form */}
              <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg ${colors.badge}`}>
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs">{selectedConfig.tip}</p>
              </div>
            </div>

            {/* Strength — placeholder changes with form */}
            <Input
              label="Strength / Concentration"
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              placeholder={selectedConfig.strengthPlaceholder}
            />
          </CardContent>
        </Card>

        {/* ── Stock & Dosage — fields change with form ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Stock & Dosage
              <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${colors.badge}`}>
                {selectedConfig.emoji} {selectedConfig.label}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`Current Stock (${selectedConfig.defaultUnit}) *`}
                name="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={handleChange}
                required
              />

              {/* Unit Type — dynamic dropdown based on form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Type
                </label>
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedConfig.unitOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dose Per Intake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="dosagePerIntake"
                    min="0.5"
                    step="0.5"
                    value={formData.dosagePerIntake}
                    onChange={handleChange}
                    placeholder={selectedConfig.dosagePlaceholder}
                    className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    {formData.unitType}
                  </span>
                </div>
              </div>

              <Input
                label="Low Stock Alert (days)"
                name="lowStockThreshold"
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={handleChange}
              />
            </div>

            {/* Stock preview */}
            {formData.currentStock > 0 && formData.dosagePerIntake > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Stock preview:</strong> {formData.currentStock} {formData.unitType} ÷{" "}
                  {formData.dosagePerIntake} {formData.unitType}/dose ={" "}
                  <strong>
                    {Math.floor(formData.currentStock / formData.dosagePerIntake)} doses
                  </strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Schedule ── */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.frequency !== "AS_NEEDED" && (
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
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-400 w-16">
                        Dose {index + 1}
                      </span>
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
            )}

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="reminderEnabled"
                  checked={formData.reminderEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable medicine reminders</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="stockAlertEnabled"
                  checked={formData.stockAlertEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable low stock alerts</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* ── Notes ── */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g., Take after meals, avoid alcohol, store below 25°C..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

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
