import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.mobile) {
    return NextResponse.json(
      { error: "No mobile number found. Please login with your phone number." },
      { status: 400 }
    );
  }

  const result = await sendSMS(
    user.mobile,
    `MedCare Test: Your SMS alerts are working! You will receive medicine reminders at scheduled times. -MedCare`
  );

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sentTo: `+91 ${user.mobile.slice(-10)}` });
}
