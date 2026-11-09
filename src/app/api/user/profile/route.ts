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

    // A mobile number can only be added or changed through /api/user/mobile, where it is
    // verified by OTP (otherwise anyone could attach a number they do not own, and the
    // real owner's OTP login would land in the wrong account). Here it can only be
    // left as it is or cleared.
    if (data.mobile) {
      const current = await prisma.user.findUnique({ where: { id: userId }, select: { mobile: true } });
      if (current?.mobile !== data.mobile) {
        return NextResponse.json(
          { error: "Verify your mobile number with an OTP to add or change it." },
          { status: 400 }
        );
      }
    }
    const clearMobile = data.mobile === "" || data.mobile === null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name || null,
        email: data.email || null,
        ...(clearMobile && { mobile: null }),
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
