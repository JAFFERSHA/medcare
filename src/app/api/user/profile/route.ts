import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export async function PATCH(request: Request) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Check mobile uniqueness if being changed
    if (data.mobile) {
      const existing = await prisma.user.findFirst({
        where: { mobile: data.mobile, NOT: { id: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: "This mobile number is already used by another account" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name || null,
        email: data.email || null,
        ...(data.mobile !== undefined && { mobile: data.mobile || null }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      mobile: updated.mobile,
    });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
