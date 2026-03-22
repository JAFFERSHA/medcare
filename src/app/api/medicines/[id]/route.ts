import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

const updateMedicineSchema = z.object({
  currentStock: z.number().int().min(0).optional(),
  dosagePerIntake: z.number().positive().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "AS_NEEDED", "CUSTOM"]).optional(),
  timesPerDay: z.number().int().min(1).max(10).optional(),
  scheduleTimes: z.array(z.string()).min(1).optional(),
  specificDays: z.array(z.number().int().min(0).max(6)).optional(),
  lowStockThreshold: z.number().int().min(1).optional(),
  reminderEnabled: z.boolean().optional(),
  stockAlertEnabled: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// GET - Get single medicine details
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get("x-user-id");
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const medicine = await prisma.patientMedicine.findFirst({
      where: { id, userId },
      include: {
        medicine: true,
        intakes: {
          orderBy: { scheduledTime: "desc" },
          take: 30,
        },
        stockHistory: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    const dailyUsage = medicine.dosagePerIntake * medicine.timesPerDay;
    const daysRemaining = dailyUsage > 0 ? Math.floor(medicine.currentStock / dailyUsage) : null;

    return NextResponse.json({
      ...medicine,
      daysRemaining,
      isLowStock: daysRemaining !== null && daysRemaining <= medicine.lowStockThreshold,
    });
  } catch (error) {
    console.error("Error fetching medicine:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update medicine
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get("x-user-id");
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateMedicineSchema.parse(body);

    // Verify ownership
    const existing = await prisma.patientMedicine.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    // If stock is being updated, create history record
    if (data.currentStock !== undefined && data.currentStock !== existing.currentStock) {
      const difference = data.currentStock - existing.currentStock;
      await prisma.stockHistory.create({
        data: {
          patientMedicineId: id,
          changeType: difference > 0 ? "PURCHASE" : "ADJUSTMENT",
          quantity: difference,
          previousStock: existing.currentStock,
          newStock: data.currentStock,
        },
      });
    }

    const updated = await prisma.patientMedicine.update({
      where: { id },
      data,
      include: { medicine: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Error updating medicine:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Deactivate medicine (soft delete)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get("x-user-id");
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.patientMedicine.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    await prisma.patientMedicine.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Medicine removed" });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
