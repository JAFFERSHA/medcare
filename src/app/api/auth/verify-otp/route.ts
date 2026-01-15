import { NextResponse } from "next/server";
import { z } from "zod";
import { isZodError, getZodErrorMessage } from "@/lib/validations";
import { verifyOTP, setAuthCookie } from "@/lib/auth";

const schema = z.object({
  mobile: z.string().regex(/^\d{10}$/),
  otp: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile, otp } = schema.parse(body);

    const result = await verifyOTP(mobile, otp);

    if (result.success && result.token) {
      await setAuthCookie(result.token);
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { success: false, message: getZodErrorMessage(error) },
        { status: 400 }
      );
    }
    console.error("Verify OTP error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
