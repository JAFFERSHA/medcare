import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

const recordIntakeSchema = z.object({
  patientMedicineId: z.string(),
  scheduledTime: z.string().datetime(),
  status: z.enum(["TAKEN", "SKIPPED"]),
  dosageTaken: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  skippedReason: z.string().nullable().optional(),
});

// GET - Get intake history
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const { searchParams } = new URL(request.url);
  const medicineId = searchParams.get("medicineId");
  // Non-numeric input used to produce an Invalid Date and a 500; clamp to 1–365 days.
  const parsedDays = parseInt(searchParams.get("days") || "7", 10);
  const days = Number.isFinite(parsedDays) ? Math.min(Math.max(parsedDays, 1), 365) : 7;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const intakes = await prisma.medicineIntake.findMany({
      where: {
        userId,
        ...(medicineId && { patientMedicineId: medicineId }),
        scheduledTime: { gte: startDate },
      },
      include: {
        patientMedicine: {
          include: { medicine: true },
        },
      },
      orderBy: { scheduledTime: "desc" },
    });

    return NextResponse.json(intakes);
  } catch (error) {
    console.error("Error fetching intake history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Record medicine intake
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = recordIntakeSchema.parse(body);
    const scheduledTime = new Date(data.scheduledTime);

    // Everything below runs in ONE transaction, with the medicine row locked, so two quick
    // taps (or two devices) are processed one after the other: stock can't be double-counted
    // and the intake record, stock level and stock history always agree.
    const intake = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM medcare."PatientMedicine" WHERE id = ${data.patientMedicineId} FOR UPDATE`;

      // Verify ownership (read AFTER taking the lock so the stock figure is current)
      const patientMedicine = await tx.patientMedicine.findFirst({
        where: { id: data.patientMedicineId, userId },
      });
      if (!patientMedicine) return null;

      const changeStock = async (
        changeType: "INTAKE" | "ADJUSTMENT",
        delta: number,
        notes?: string
      ) => {
        // Never go below zero; record the change that actually happened
        const newStock = Math.max(0, patientMedicine.currentStock + delta);
        await tx.patientMedicine.update({
          where: { id: data.patientMedicineId },
          data: { currentStock: newStock },
        });
        await tx.stockHistory.create({
          data: {
            patientMedicineId: data.patientMedicineId,
            changeType,
            quantity: newStock - patientMedicine.currentStock,
            previousStock: patientMedicine.currentStock,
            newStock,
            ...(notes && { notes }),
          },
        });
      };

      const dosageUsed = data.dosageTaken ?? patientMedicine.dosagePerIntake;

      // Check if intake already exists for this time
      const existingIntake = await tx.medicineIntake.findFirst({
        where: { patientMedicineId: data.patientMedicineId, scheduledTime },
      });

      if (existingIntake) {
        const updated = await tx.medicineIntake.update({
          where: { id: existingIntake.id },
          data: {
            takenAt: data.status === "TAKEN" ? new Date() : null,
            status: data.status,
            dosageTaken: dosageUsed,
            notes: data.notes,
            skippedReason: data.skippedReason,
          },
        });

        // Adjust stock only if status changed
        if (existingIntake.status !== data.status) {
          if (data.status === "TAKEN" && existingIntake.status !== "TAKEN") {
            await changeStock("INTAKE", -dosageUsed);
          } else if (data.status !== "TAKEN" && existingIntake.status === "TAKEN") {
            const dosageToRestore = existingIntake.dosageTaken ?? patientMedicine.dosagePerIntake;
            await changeStock("ADJUSTMENT", dosageToRestore, "Restored from undo");
          }
        }
        return updated;
      }

      const created = await tx.medicineIntake.create({
        data: {
          patientMedicineId: data.patientMedicineId,
          userId,
          scheduledTime,
          takenAt: data.status === "TAKEN" ? new Date() : null,
          status: data.status,
          dosageTaken: dosageUsed,
          notes: data.notes,
          skippedReason: data.skippedReason,
        },
      });
      if (data.status === "TAKEN") {
        await changeStock("INTAKE", -dosageUsed);
      }
      return created;
    });

    if (!intake) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Error recording intake:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
