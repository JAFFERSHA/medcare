import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { checkOTP, sendOTP } from "@/lib/auth";
import { rateLimit, tooManyMessage } from "@/lib/rate-limit";

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const sendSchema = z.object({ mobile: mobileSchema });
const verifySchema = z.object({ mobile: mobileSchema, otp: z.string().length(6) });

async function isUsedByAnotherAccount(mobile: string, userId: string) {
  const existing = await prisma.user.findFirst({ where: { mobile, NOT: { id: userId } } });
  return Boolean(existing);
}

// POST - step 1: send a verification code to the number the user wants to add/change to
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mobile } = sendSchema.parse(await request.json());

    const limit = await rateLimit(`mobile-send:user:${userId}`, 5, 60 * 60);
    if (!limit.ok) {
      return NextResponse.json({ error: tooManyMessage(limit.retryAfterSec) }, { status: 429 });
    }

    if (await isUsedByAnotherAccount(mobile, userId)) {
      return NextResponse.json(
        { error: "This mobile number is already used by another account" },
        { status: 409 }
      );
    }

    const result = await sendOTP(mobile, "verify");
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Mobile verification (send) error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - step 2: check the code and, only if it is right, attach the number to the account
export async function PUT(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mobile, otp } = verifySchema.parse(await request.json());

    const limit = await rateLimit(`mobile-verify:user:${userId}`, 20, 60 * 60);
    if (!limit.ok) {
      return NextResponse.json({ error: tooManyMessage(limit.retryAfterSec) }, { status: 429 });
    }

    if (await isUsedByAnotherAccount(mobile, userId)) {
      return NextResponse.json(
        { error: "This mobile number is already used by another account" },
        { status: 409 }
      );
    }

    const check = await checkOTP(mobile, otp);
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data: { mobile } });
    // Mark any other outstanding codes for this number as used
    await prisma.oTPRequest.updateMany({
      where: { mobile, verified: false },
      data: { verified: true, userId },
    });

    return NextResponse.json({ success: true, mobile });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 });
    }
    console.error("Mobile verification (verify) error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
