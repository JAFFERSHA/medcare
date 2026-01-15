import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOTP } from "@/lib/auth";
import { isZodError, getZodErrorMessage } from "@/lib/validations";

const schema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Invalid mobile number (10 digits required)"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile } = schema.parse(body);

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
