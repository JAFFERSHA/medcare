import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

const addStockSchema = z.object({
  patientMedicineId: z.string(),
  quantity: z.number().int().positive("Quantity must be positive"),
  notes: z.string().nullable().optional(),
});

// POST - Add stock to medicine
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = addStockSchema.parse(body);

    // Verify ownership
    const patientMedicine = await prisma.patientMedicine.findFirst({
      where: { id: data.patientMedicineId, userId },
    });

    if (!patientMedicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    const newStock = patientMedicine.currentStock + data.quantity;

    // Update stock
    await prisma.patientMedicine.update({
      where: { id: data.patientMedicineId },
      data: { currentStock: newStock },
    });

    // Create stock history record
    await prisma.stockHistory.create({
      data: {
        patientMedicineId: data.patientMedicineId,
        changeType: "PURCHASE",
        quantity: data.quantity,
        previousStock: patientMedicine.currentStock,
        newStock,
        notes: data.notes,
      },
    });

    return NextResponse.json({
      success: true,
      previousStock: patientMedicine.currentStock,
      newStock,
    });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Error adding stock:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
