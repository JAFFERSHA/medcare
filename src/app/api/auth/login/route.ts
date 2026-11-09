import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOTP } from "@/lib/auth";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { getClientIp, rateLimit, tooManyMessage } from "@/lib/rate-limit";

const schema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Invalid mobile number (10 digits required)"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile } = schema.parse(body);

    // Every OTP is a paid SMS: cap how many numbers one IP can text per hour.
    const limit = await rateLimit(`otp-send:ip:${getClientIp(request.headers)}`, 10, 60 * 60);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: tooManyMessage(limit.retryAfterSec) },
        { status: 429 }
      );
    }

    const result = await sendOTP(mobile);

    return NextResponse.json(result);
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { success: false, message: getZodErrorMessage(error) },
        { status: 400 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
