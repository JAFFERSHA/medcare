import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

const createMedicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  genericName: z.string().optional(),
  description: z.string().optional(),
  dosageForm: z
    .enum(["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "DROPS", "INHALER", "OTHER"])
    .default("TABLET"),
  strength: z.string().optional(),
  currentStock: z.number().int().min(0).default(0),
  unitType: z.string().default("tablets"),
  dosagePerIntake: z.number().positive().default(1),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "AS_NEEDED", "CUSTOM"]).default("DAILY"),
  timesPerDay: z.number().int().min(1).max(10).default(1),
  scheduleTimes: z.array(z.string()).min(1, "At least one schedule time is required"),
  specificDays: z.array(z.number().int().min(0).max(6)).optional(),
  lowStockThreshold: z.number().int().min(1).default(7),
  reminderEnabled: z.boolean().default(true),
  stockAlertEnabled: z.boolean().default(true),
  notes: z.string().optional(),
});

// GET - List all patient medicines
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const medicines = await prisma.patientMedicine.findMany({
      where: { userId, isActive: true },
      include: {
        medicine: true,
        intakes: {
          where: {
            scheduledTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
          orderBy: { scheduledTime: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate days until stock runs out
    const medicinesWithStockInfo = medicines.map((pm) => {
      const dailyUsage = pm.dosagePerIntake * pm.timesPerDay;
      const daysRemaining = dailyUsage > 0 ? Math.floor(pm.currentStock / dailyUsage) : Infinity;
      const runOutDate = new Date();
      runOutDate.setDate(runOutDate.getDate() + daysRemaining);

      return {
        ...pm,
        daysRemaining: daysRemaining === Infinity ? null : daysRemaining,
        runOutDate: daysRemaining === Infinity ? null : runOutDate,
        isLowStock: daysRemaining !== Infinity && daysRemaining <= pm.lowStockThreshold,
      };
    });

    return NextResponse.json(medicinesWithStockInfo);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new medicine for patient
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createMedicineSchema.parse(body);

    // Find or create medicine in master table
    let medicine = await prisma.medicine.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });

    if (!medicine) {
      medicine = await prisma.medicine.create({
        data: {
          name: data.name,
          genericName: data.genericName,
          description: data.description,
          dosageForm: data.dosageForm,
          strength: data.strength,
        },
      });
    }

    // Check if patient already has this medicine
    const existing = await prisma.patientMedicine.findUnique({
      where: { userId_medicineId: { userId, medicineId: medicine.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have this medicine in your list" },
        { status: 400 }
      );
    }

    // Create patient-medicine relationship
    const patientMedicine = await prisma.patientMedicine.create({
      data: {
        userId,
        medicineId: medicine.id,
        currentStock: data.currentStock,
        unitType: data.unitType,
        dosagePerIntake: data.dosagePerIntake,
        frequency: data.frequency,
        timesPerDay: data.timesPerDay,
        scheduleTimes: data.scheduleTimes,
        specificDays: data.specificDays,
        lowStockThreshold: data.lowStockThreshold,
        reminderEnabled: data.reminderEnabled,
        stockAlertEnabled: data.stockAlertEnabled,
        notes: data.notes,
      },
      include: { medicine: true },
    });

    // Create initial stock history record
    if (data.currentStock > 0) {
      await prisma.stockHistory.create({
        data: {
          patientMedicineId: patientMedicine.id,
          changeType: "PURCHASE",
          quantity: data.currentStock,
          previousStock: 0,
          newStock: data.currentStock,
          notes: "Initial stock",
        },
      });
    }

    return NextResponse.json(patientMedicine, { status: 201 });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Error creating medicine:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
