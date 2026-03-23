import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getMedicineReminderEmail, getStockAlertEmail } from "@/lib/email";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await request.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) {
    return NextResponse.json(
      { error: "No email address saved. Please add your email in Profile first." },
      { status: 400 }
    );
  }

  let result;

  if (type === "reminder") {
    result = await sendEmail({
      to: user.email,
      subject: "✅ MedCare — Test Medicine Reminder",
      html: getMedicineReminderEmail("Paracetamol (Test)", "10:00 AM", "1 tablet"),
    });
  } else if (type === "stock") {
    result = await sendEmail({
      to: user.email,
      subject: "⚠️ MedCare — Test Stock Alert",
      html: getStockAlertEmail("Amoxicillin (Test)", 3, 6, "capsules"),
    });
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sentTo: user.email });
}
