import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, getPasswordResetEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: true }); // Always succeed to not leak info
    }

    const { email } = result.data;

    // Limit reset emails per IP and per address. The response is the same either way,
    // so this does not reveal whether an account exists.
    const [byIp, byEmail] = await Promise.all([
      rateLimit(`forgot:ip:${getClientIp(request.headers)}`, 10, 60 * 60),
      rateLimit(`forgot:email:${email.toLowerCase()}`, 3, 60 * 60),
    ]);
    if (!byIp.ok || !byEmail.ok) {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findFirst({ where: { email } });

    // Always return success — never reveal if email exists
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your MedCare password",
      html: getPasswordResetEmail(resetUrl, user.name),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: true }); // Still return success
  }
}
