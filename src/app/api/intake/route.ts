import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

const recordIntakeSchema = z.object({
  patientMedicineId: z.string(),
  scheduledTime: z.string().datetime(),
  status: z.enum(["TAKEN", "SKIPPED"]),
  dosageTaken: z.number().positive().optional(),
  notes: z.string().optional(),
  skippedReason: z.string().optional(),
});

// GET - Get intake history
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const { searchParams } = new URL(request.url);
  const medicineId = searchParams.get("medicineId");
  const days = parseInt(searchParams.get("days") || "7", 10);

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

    // Verify ownership
    const patientMedicine = await prisma.patientMedicine.findFirst({
      where: { id: data.patientMedicineId, userId },
    });

    if (!patientMedicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    // Check if intake already exists for this time
    const existingIntake = await prisma.medicineIntake.findFirst({
      where: {
        patientMedicineId: data.patientMedicineId,
        scheduledTime: new Date(data.scheduledTime),
      },
    });

    let intake;

    if (existingIntake) {
      // Update existing intake
      intake = await prisma.medicineIntake.update({
        where: { id: existingIntake.id },
        data: {
          takenAt: data.status === "TAKEN" ? new Date() : null,
          status: data.status,
          dosageTaken: data.dosageTaken ?? patientMedicine.dosagePerIntake,
          notes: data.notes,
          skippedReason: data.skippedReason,
        },
      });

      // Adjust stock only if status changed
      if (existingIntake.status !== data.status) {
        if (data.status === "TAKEN" && existingIntake.status !== "TAKEN") {
          // Deduct stock
          const dosageUsed = data.dosageTaken ?? patientMedicine.dosagePerIntake;
          const newStock = Math.max(0, patientMedicine.currentStock - dosageUsed);

          await prisma.patientMedicine.update({
            where: { id: data.patientMedicineId },
            data: { currentStock: newStock },
          });

          await prisma.stockHistory.create({
            data: {
              patientMedicineId: data.patientMedicineId,
              changeType: "INTAKE",
              quantity: -dosageUsed,
              previousStock: patientMedicine.currentStock,
              newStock,
            },
          });
        } else if (data.status !== "TAKEN" && existingIntake.status === "TAKEN") {
          // Restore stock
          const dosageToRestore = existingIntake.dosageTaken ?? patientMedicine.dosagePerIntake;
          const newStock = patientMedicine.currentStock + dosageToRestore;

          await prisma.patientMedicine.update({
            where: { id: data.patientMedicineId },
            data: { currentStock: newStock },
          });

          await prisma.stockHistory.create({
            data: {
              patientMedicineId: data.patientMedicineId,
              changeType: "ADJUSTMENT",
              quantity: dosageToRestore,
              previousStock: patientMedicine.currentStock,
              newStock,
              notes: "Restored from undo",
            },
          });
        }
      }
    } else {
      // Create new intake record
      intake = await prisma.medicineIntake.create({
        data: {
          patientMedicineId: data.patientMedicineId,
          userId,
          scheduledTime: new Date(data.scheduledTime),
          takenAt: data.status === "TAKEN" ? new Date() : null,
          status: data.status,
          dosageTaken: data.dosageTaken ?? patientMedicine.dosagePerIntake,
          notes: data.notes,
          skippedReason: data.skippedReason,
        },
      });

      // Update stock if taken
      if (data.status === "TAKEN") {
        const dosageUsed = data.dosageTaken ?? patientMedicine.dosagePerIntake;
        const newStock = Math.max(0, patientMedicine.currentStock - dosageUsed);

        await prisma.patientMedicine.update({
          where: { id: data.patientMedicineId },
          data: { currentStock: newStock },
        });

        await prisma.stockHistory.create({
          data: {
            patientMedicineId: data.patientMedicineId,
            changeType: "INTAKE",
            quantity: -dosageUsed,
            previousStock: patientMedicine.currentStock,
            newStock,
          },
        });
      }
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
